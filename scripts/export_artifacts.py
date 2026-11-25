import json
import os
import re
import struct
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
from sklearn.neighbors import KNeighborsClassifier

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(ROOT, "dataset_berlabel_sentimen_dota2_mobilelegends.csv")
MODELS_DIR = os.path.join(ROOT, "public", "models")
DATA_DIR = os.path.join(ROOT, "public", "data")
SCRIPTS_DIR = os.path.join(ROOT, "scripts")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)


def preprocessing(teks: str) -> str:
    teks = teks.lower()
    teks = re.sub(r"http\S+|www\S+", "", teks)
    teks = re.sub(r"<.*?>", "", teks)
    teks = re.sub(r"\d+", "", teks)
    teks = re.sub(r"[^a-z\s]", " ", teks)
    teks = re.sub(r"\s+", " ", teks).strip()
    return teks


def main() -> None:
    df = pd.read_csv(CSV_PATH)
    df = df.dropna(subset=["review", "label", "game"])
    df = df.drop_duplicates(subset=["review", "game"])
    df["label"] = df["label"].str.lower().str.strip()
    df = df[df["label"].isin(["positive", "negative"])].reset_index(drop=True)
    df["review_clean"] = df["review"].apply(preprocessing)

    X = df["review_clean"]
    y = df["label"]

    X_train_text, X_test_text, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    tfidf = TfidfVectorizer(
        stop_words="english",
        max_features=5000,
        ngram_range=(1, 2),
        min_df=2,
    )
    X_train = tfidf.fit_transform(X_train_text).tocsr()
    X_test = tfidf.transform(X_test_text).tocsr()

    model_nb = MultinomialNB()
    model_nb.fit(X_train, y_train)
    pred_nb = model_nb.predict(X_test)
    proba_nb = model_nb.predict_proba(X_test)

    model_knn = KNeighborsClassifier(
        n_neighbors=5,
        metric="cosine",
        algorithm="brute",
    )
    model_knn.fit(X_train, y_train)
    pred_knn = model_knn.predict(X_test)
    proba_knn = model_knn.predict_proba(X_test)
    knn_dists, knn_idxs = model_knn.kneighbors(X_test)

    # 1. Export TF-IDF + MultinomialNB JSON
    vocab = {k: int(v) for k, v in tfidf.vocabulary_.items()}
    tfidf_nb_payload = {
        "version": 1,
        "preprocessing": {
            "steps": [
                "lowercase",
                "remove_urls",
                "remove_html_tags",
                "remove_digits",
                "keep_only_ascii_letters_and_whitespace",
                "collapse_whitespace_and_strip",
            ]
        },
        "tfidf": {
            "stopWords": sorted(list(tfidf.get_stop_words())),
            "maxFeatures": 5000,
            "ngramRange": [1, 2],
            "minDf": 2,
            "maxDf": 1.0,
            "norm": "l2",
            "useIdf": True,
            "smoothIdf": True,
            "sublinearTf": False,
            "tokenPattern": "(?u)\\b\\w\\w+\\b",
            "vocabularySize": len(vocab),
            "vocabulary": vocab,
            "idf": [round(float(x), 8) for x in tfidf.idf_],
        },
        "naiveBayes": {
            "alpha": float(model_nb.alpha),
            "fitPrior": bool(model_nb.fit_prior),
            "classes": [str(c) for c in model_nb.classes_],
            "classCount": [int(x) for x in model_nb.class_count_],
            "classLogPrior": [float(x) for x in model_nb.class_log_prior_],
            "featureLogProb": [
                [float(val) for val in row] for row in model_nb.feature_log_prob_
            ],
        },
    }
    tfidf_nb_path = os.path.join(MODELS_DIR, "tfidf-nb.json")
    with open(tfidf_nb_path, "w", encoding="utf-8") as f:
        json.dump(tfidf_nb_payload, f, separators=(",", ":"))

    # 2. Export KNN binary CSR + metadata
    # Binary format (little-endian):
    # Magic: 4 bytes 'GKNN'
    # version: uint32 (1)
    # nDocs: uint32 (3997)
    # nFeatures: uint32 (5000)
    # nnz: uint32 (77055)
    # indptr: uint32[nDocs + 1]
    # indices: uint16[nnz]
    # data: float32[nnz]
    # labels: uint8[nDocs] (0=negative, 1=positive)
    n_docs, n_features = X_train.shape
    nnz = int(X_train.nnz)
    indptr = X_train.indptr.astype(np.uint32)
    indices = X_train.indices.astype(np.uint16)
    data = X_train.data.astype(np.float32)
    label_map = {"negative": 0, "positive": 1}
    labels_arr = np.array([label_map[str(lbl)] for lbl in y_train], dtype=np.uint8)

    knn_bin_path = os.path.join(MODELS_DIR, "knn-train.bin")
    with open(knn_bin_path, "wb") as f:
        f.write(b"GKNN")
        f.write(struct.pack("<IIII", 1, n_docs, n_features, nnz))
        f.write(indptr.tobytes())
        f.write(indices.tobytes())
        f.write(data.tobytes())
        f.write(labels_arr.tobytes())

    knn_meta_path = os.path.join(MODELS_DIR, "knn-meta.json")
    with open(knn_meta_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "version": 1,
                "k": 5,
                "metric": "cosine",
                "algorithm": "brute",
                "weights": "uniform",
                "classes": ["negative", "positive"],
                "nDocs": n_docs,
                "nFeatures": n_features,
                "nnz": nnz,
                "binaryFile": "/models/knn-train.bin",
            },
            f,
            indent=2,
        )

    # 3. Export research dataset & metadata
    records = df[["id", "game", "review", "label", "label_source"]].to_dict(
        orient="records"
    )
    for rec in records:
        rec["id"] = str(rec["id"])
    dataset_path = os.path.join(DATA_DIR, "research-dataset.json")
    with open(dataset_path, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, separators=(",", ":"))

    # Compute exact dataset statistics and evaluation metrics
    def compute_game_stats(sub_df: pd.DataFrame) -> dict:
        total = int(len(sub_df))
        pos = int((sub_df["label"] == "positive").sum())
        neg = int((sub_df["label"] == "negative").sum())
        sources = {str(k): int(v) for k, v in sub_df["label_source"].value_counts().items()}
        avg_len = float(sub_df["review"].str.len().mean())
        avg_words = float(sub_df["review"].str.split().str.len().mean())
        return {
            "total": total,
            "positive": pos,
            "negative": neg,
            "positivePct": round(pos / total * 100, 2) if total else 0,
            "negativePct": round(neg / total * 100, 2) if total else 0,
            "labelSources": sources,
            "avgCharLength": round(avg_len, 1),
            "avgWordCount": round(avg_words, 1),
        }

    # Top TF-IDF terms per sentiment from training set
    inv_vocab = {idx: term for term, idx in tfidf.vocabulary_.items()}
    y_train_arr = np.array(y_train)
    pos_mean = np.asarray(X_train[y_train_arr == "positive"].mean(axis=0)).ravel()
    neg_mean = np.asarray(X_train[y_train_arr == "negative"].mean(axis=0)).ravel()
    top_pos_idx = pos_mean.argsort()[::-1][:15]
    top_neg_idx = neg_mean.argsort()[::-1][:15]

    def eval_dict(y_true, y_pred) -> dict:
        cm = confusion_matrix(y_true, y_pred, labels=["negative", "positive"])
        report = classification_report(
            y_true, y_pred, labels=["negative", "positive"], output_dict=True
        )
        return {
            "accuracy": float(accuracy_score(y_true, y_pred)),
            "precisionPositive": float(
                precision_score(y_true, y_pred, pos_label="positive")
            ),
            "recallPositive": float(
                recall_score(y_true, y_pred, pos_label="positive")
            ),
            "f1Positive": float(f1_score(y_true, y_pred, pos_label="positive")),
            "confusionMatrix": {
                "labels": ["negative", "positive"],
                "matrix": cm.tolist(),
                "tn": int(cm[0, 0]),
                "fp": int(cm[0, 1]),
                "fn": int(cm[1, 0]),
                "tp": int(cm[1, 1]),
            },
            "classificationReport": {
                "negative": {
                    "precision": float(report["negative"]["precision"]),
                    "recall": float(report["negative"]["recall"]),
                    "f1Score": float(report["negative"]["f1-score"]),
                    "support": int(report["negative"]["support"]),
                },
                "positive": {
                    "precision": float(report["positive"]["precision"]),
                    "recall": float(report["positive"]["recall"]),
                    "f1Score": float(report["positive"]["f1-score"]),
                    "support": int(report["positive"]["support"]),
                },
                "macroAvg": {
                    "precision": float(report["macro avg"]["precision"]),
                    "recall": float(report["macro avg"]["recall"]),
                    "f1Score": float(report["macro avg"]["f1-score"]),
                    "support": int(report["macro avg"]["support"]),
                },
                "weightedAvg": {
                    "precision": float(report["weighted avg"]["precision"]),
                    "recall": float(report["weighted avg"]["recall"]),
                    "f1Score": float(report["weighted avg"]["f1-score"]),
                    "support": int(report["weighted avg"]["support"]),
                },
            },
        }

    metadata = {
        "sourceFile": "dataset_berlabel_sentimen_dota2_mobilelegends.csv",
        "notebookFile": "Klasifikasi_Sentimen_Dota2_dan_Mobile_Legends.ipynb",
        "dataset": {
            "totalReviews": int(len(df)),
            "positiveReviews": int((df["label"] == "positive").sum()),
            "negativeReviews": int((df["label"] == "negative").sum()),
            "positivePct": round(float((df["label"] == "positive").mean() * 100), 2),
            "negativePct": round(float((df["label"] == "negative").mean() * 100), 2),
            "nullCount": 0,
            "duplicateCount": 0,
            "columns": list(df.columns[:5]),
            "games": {
                "Mobile Legends": compute_game_stats(
                    df[df["game"] == "Mobile Legends"]
                ),
                "Dota 2": compute_game_stats(df[df["game"] == "Dota 2"]),
            },
            "split": {
                "trainSize": int(len(X_train_text)),
                "testSize": int(len(X_test_text)),
                "testRatio": 0.2,
                "randomState": 42,
                "stratified": True,
                "trainDistribution": {
                    "negative": int((y_train == "negative").sum()),
                    "positive": int((y_train == "positive").sum()),
                },
                "testDistribution": {
                    "negative": int((y_test == "negative").sum()),
                    "positive": int((y_test == "positive").sum()),
                },
            },
            "topTerms": {
                "positive": [
                    {"term": inv_vocab[int(i)], "meanTfidf": round(float(pos_mean[i]), 5)}
                    for i in top_pos_idx
                ],
                "negative": [
                    {"term": inv_vocab[int(i)], "meanTfidf": round(float(neg_mean[i]), 5)}
                    for i in top_neg_idx
                ],
            },
        },
        "models": {
            "tfidf": {
                "vocabularySize": len(vocab),
                "ngramRange": [1, 2],
                "minDf": 2,
                "maxFeatures": 5000,
                "stopWords": "english (318 terms)",
                "norm": "l2",
                "smoothIdf": True,
                "sublinearTf": False,
                "tokenPattern": "(?u)\\b\\w\\w+\\b",
                "trainNnz": nnz,
            },
            "naiveBayes": {
                "name": "Multinomial Naive Bayes",
                "params": {
                    "alpha": float(model_nb.alpha),
                    "fitPrior": bool(model_nb.fit_prior),
                    "classes": [str(c) for c in model_nb.classes_],
                    "classCount": [int(x) for x in model_nb.class_count_],
                    "classLogPrior": [round(float(x), 8) for x in model_nb.class_log_prior_],
                    "classPriorProb": [
                        round(float(np.exp(x)), 6) for x in model_nb.class_log_prior_
                    ],
                    "nFeatures": int(model_nb.n_features_in_),
                },
                "evaluation": eval_dict(y_test, pred_nb),
            },
            "knn": {
                "name": "K-Nearest Neighbors",
                "params": {
                    "nNeighbors": 5,
                    "metric": "cosine",
                    "algorithm": "brute",
                    "weights": "uniform",
                    "trainingVectors": n_docs,
                    "nFeatures": n_features,
                    "sparseNnz": nnz,
                },
                "evaluation": eval_dict(y_test, pred_knn),
            },
        },
    }

    metadata_path = os.path.join(DATA_DIR, "research-metadata.json")
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    # 4. Export validation fixtures (all 1000 test reviews + edge cases)
    edge_texts = [
        "",
        "   ",
        "https://store.steampowered.com <b>12345</b> !!!",
        "the and or is",
        "Great game! Best MOBA ever, awesome teammates and fun mechanics.",
        "Terrible matchmaking, laggy servers, toxic players and pay to win garbage.",
    ]
    edge_clean = [preprocessing(t) for t in edge_texts]
    edge_vec = tfidf.transform(edge_clean).tocsr()
    edge_nb_pred = model_nb.predict(edge_vec)
    edge_nb_proba = model_nb.predict_proba(edge_vec)
    edge_knn_pred = model_knn.predict(edge_vec)
    edge_knn_proba = model_knn.predict_proba(edge_vec)

    test_indices = list(X_test_text.index)
    test_cases = []
    for pos_i, orig_idx in enumerate(test_indices):
        row = X_test.getrow(pos_i)
        test_cases.append(
            {
                "id": str(df.loc[orig_idx, "id"]),
                "rawText": str(df.loc[orig_idx, "review"]),
                "cleanText": str(X_test_text.iloc[pos_i]),
                "actualLabel": str(y_test.iloc[pos_i]),
                "tfidfNnz": [
                    [int(c), float(v)] for c, v in zip(row.indices, row.data)
                ],
                "nbPred": str(pred_nb[pos_i]),
                "nbProba": [float(proba_nb[pos_i][0]), float(proba_nb[pos_i][1])],
                "knnPred": str(pred_knn[pos_i]),
                "knnVotePos": float(proba_knn[pos_i][1]),
                "knnTop5Idx": [int(x) for x in knn_idxs[pos_i]],
                "knnTop5Dist": [float(x) for x in knn_dists[pos_i]],
            }
        )

    edge_cases = []
    for i, raw in enumerate(edge_texts):
        row = edge_vec.getrow(i)
        edge_cases.append(
            {
                "rawText": raw,
                "cleanText": edge_clean[i],
                "tfidfNnz": [[int(c), float(v)] for c, v in zip(row.indices, row.data)],
                "nbPred": str(edge_nb_pred[i]),
                "nbProba": [float(edge_nb_proba[i][0]), float(edge_nb_proba[i][1])],
                "knnPred": str(edge_knn_pred[i]),
                "knnVotePos": float(edge_knn_proba[i][1]),
            }
        )

    fixtures_path = os.path.join(SCRIPTS_DIR, "validation-fixtures.json")
    with open(fixtures_path, "w", encoding="utf-8") as f:
        json.dump({"testCases": test_cases, "edgeCases": edge_cases}, f)

    for p in [tfidf_nb_path, knn_bin_path, knn_meta_path, dataset_path, metadata_path, fixtures_path]:
        print(f"{os.path.relpath(p, ROOT)}: {os.path.getsize(p):,} bytes")


if __name__ == "__main__":
    main()
