import numpy as np
from sklearn.preprocessing import LabelEncoder

# Load
X = np.load("X.npy")
y = np.load("y.npy", allow_pickle=True)

# Normalize relative to wrist (landmark 0)
def normalize(sample):
    sample = sample.reshape(21, 3)
    wrist = sample[0]
    sample = sample - wrist
    return sample.flatten()

X_norm = np.array([normalize(x) for x in X])

X_aug = []
y_aug = []

for i in range(len(X_norm)):
    sample = X_norm[i]
    label = y[i]

    # original
    X_aug.append(sample)
    y_aug.append(label)

    # 3 augmented copies
    for _ in range(3):
        noise = np.random.normal(0, 0.01, sample.shape)
        X_aug.append(sample + noise)
        y_aug.append(label)

X = np.array(X_aug)
y = np.array(y_aug)


# Encode labels to numbers
le = LabelEncoder()
y_encoded = le.fit_transform(y)

# Save processed data
np.save("X.npy", X)
np.save("y.npy", y_encoded)
np.save("classes.npy", le.classes_)

print("Preprocessing complete.")
print("Classes:", le.classes_)
print("Data shape:", X.shape)
