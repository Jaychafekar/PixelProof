"""
PixelProof - Simple Training Script for Deepfake Detection
Simplified version to avoid TensorFlow issues on Windows
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, BatchNormalization, GlobalAveragePooling2D
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# Configuration
DATASET_DIR = os.path.join("..", "data", "real_and_fake_face_detection", "real_and_fake_face")
MODEL_DIR = os.path.join("..", "backend", "model")
MODEL_PATH = os.path.join(MODEL_DIR, "deepfake_detection_model.h5")

IMG_SIZE = (96, 96)
BATCH_SIZE = 32
EPOCHS = 6  # Short fine-tune run
LEARNING_RATE = 1e-5   # Small LR for fine-tuning
UNFREEZE_LAST_N = 30   # Number of backbone layers to unfreeze for fine-tuning

# Check dataset
train_real_dir = os.path.join(DATASET_DIR, "training_real")
train_fake_dir = os.path.join(DATASET_DIR, "training_fake")

if not os.path.exists(train_real_dir) or not os.path.exists(train_fake_dir):
    raise FileNotFoundError(f"Dataset not found at {DATASET_DIR}")

os.makedirs(MODEL_DIR, exist_ok=True)

# Seed for reproducibility
SEED = 42
np.random.seed(SEED)
tf.random.set_seed(SEED)

print("=" * 60)
print("PixelProof: Training Deepfake Detection Model")
print("=" * 60)

# Data loading
print("\n📊 Loading dataset...")
datagen = ImageDataGenerator(
    rescale=1.0 / 255.0,
    horizontal_flip=True,
    rotation_range=10,
    width_shift_range=0.1,
    height_shift_range=0.1,
    zoom_range=0.1,
    validation_split=0.2
)

train_gen = datagen.flow_from_directory(
    DATASET_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    subset="training",
    shuffle=True,
    seed=SEED
)

val_gen = datagen.flow_from_directory(
    DATASET_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    subset="validation",
    shuffle=False
)

class_indices = train_gen.class_indices
print(f"✅ Classes: {class_indices}")
print(f"✅ Training samples: {train_gen.samples}")
print(f"✅ Validation samples: {val_gen.samples}")

# Build model
print("\n🏗️  Building model...")
tf.keras.backend.clear_session()

base = MobileNetV2(
    include_top=False,
    weights="imagenet",
    input_shape=(IMG_SIZE[0], IMG_SIZE[1], 3)
)
base.trainable = False

model = Sequential([
    base,
    GlobalAveragePooling2D(),
    Dense(512, activation="relu"),
    BatchNormalization(),
    Dropout(0.3),
    Dense(128, activation="relu"),
    Dropout(0.2),
    Dense(2, activation="softmax")
])

# Unfreeze last N layers of backbone for fine-tuning
print(f"\n🔧 Fine-tuning: unfreezing last {UNFREEZE_LAST_N} layers of MobileNetV2")
for layer in base.layers[-UNFREEZE_LAST_N:]:
    layer.trainable = True

# Compile with small learning rate for stable fine-tuning
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=LEARNING_RATE),
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

print(f"✅ Model compiled for fine-tuning (LR={LEARNING_RATE})")
print(f"✅ Model built with {model.count_params():,} parameters")

# Train
print(f"\n⏳ Fine-tuning for {EPOCHS} epochs with LR={LEARNING_RATE}...")
print("(This may take several minutes on CPU — EarlyStopping will stop early if no improvement.)")
print("-" * 60)

# Callbacks: early stop, best-model checkpoint, LR reduction
early_stop = tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=3, restore_best_weights=True, verbose=1)
model_checkpoint = tf.keras.callbacks.ModelCheckpoint(MODEL_PATH, monitor='val_loss', save_best_only=True, verbose=1)
reduce_lr = tf.keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, verbose=1)
callbacks = [early_stop, model_checkpoint, reduce_lr]

history = model.fit(
    train_gen,
    epochs=EPOCHS,
    validation_data=val_gen,
    callbacks=callbacks,
    verbose=1
)

# Save
print("\n💾 Saving model...")
model.save(MODEL_PATH)
print(f"✅ Model saved to: {MODEL_PATH}")

# Evaluate
print("\n📈 Final Evaluation:")
val_gen.reset()
pred_probs = model.predict(val_gen, verbose=0)
y_pred = np.argmax(pred_probs, axis=1)
y_true = val_gen.classes
accuracy = np.mean(y_pred == y_true)

print(f"   Validation Accuracy: {accuracy:.2%}")
print("\n" + "=" * 60)
print("✅ Training complete! Model is ready for predictions.")
print("=" * 60)
