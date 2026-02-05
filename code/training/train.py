"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    PixelProof - Deepfake Detection Model Training           ║
║                                                                              ║
║  This script trains a deep learning model to detect deepfake images/videos   ║
║  using a pre-trained MobileNetV2 backbone with transfer learning.           ║
║                                                                              ║
║  How it works:                                                               ║
║  1. Loads real vs fake face images from your dataset folders                ║
║  2. Preprocesses and augments images for better training                    ║
║  3. Trains a CNN classifier using MobileNetV2 (lightweight & fast)          ║
║  4. Saves the trained model for making predictions                          ║
║  5. Evaluates performance on validation data                                ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import os
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt

from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, BatchNormalization, GlobalAveragePooling2D
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# ============================================================================
# OPTIONAL: Import sklearn for detailed metrics (if not available, continue)
# ============================================================================
try:
    from sklearn.metrics import classification_report, confusion_matrix
    has_sklearn = True
except ImportError:
    has_sklearn = False
    print("⚠️  scikit-learn not available. Skipping detailed evaluation.")


# ============================================================================
# CONFIGURATION - EDIT HERE TO CUSTOMIZE TRAINING
# ============================================================================

# 📁 Dataset paths
# Expected folder structure:
#   data/real_and_fake_face_detection/real_and_fake_face/
#   ├── training_real/     (your real face images)
#   └── training_fake/     (your deepfake/fake images)
DATASET_DIR = os.path.join("..", "data", "real_and_fake_face_detection", "real_and_fake_face")

# 📁 Where to save the trained model
MODEL_DIR = os.path.join("..", "backend", "model")
MODEL_PATH = os.path.join(MODEL_DIR, "deepfake_detection_model.h5")

# 🎯 Training parameters
IMAGE_SIZE = (96, 96)          # Input image dimensions (96x96 pixels)
BATCH_SIZE = 32                # How many images to process at once
EPOCHS = 20                    # Number of training cycles through all data
SHOW_PLOTS = False             # Set to True if you want to see training graphs

# 🔒 Random seed for reproducible results
SEED = 42
np.random.seed(SEED)
tf.random.set_seed(SEED)

print("\n" + "="*80)
print("🚀 PIXELPROOF MODEL TRAINING - Starting Up")
print("="*80)


# ============================================================================
# STEP 1: VALIDATE DATASET EXISTS
# ============================================================================

print("\n📂 Checking dataset folders...")
training_real_path = os.path.join(DATASET_DIR, "training_real")
training_fake_path = os.path.join(DATASET_DIR, "training_fake")

if not os.path.exists(training_real_path) or not os.path.exists(training_fake_path):
    raise FileNotFoundError(
        f"\n❌ Dataset not found!\n"
        f"Expected these folders:\n"
        f"  • {training_real_path}\n"
        f"  • {training_fake_path}\n\n"
        f"Solution: Make sure you have the correct dataset structure."
    )

print("✅ Dataset folders found!")
os.makedirs(MODEL_DIR, exist_ok=True)


# ============================================================================
# STEP 2: PREPARE DATA - IMAGE LOADING & AUGMENTATION
# ============================================================================

print("\n🔄 Setting up data loading with augmentation...")
print("   • Normalizing pixel values (0-255 → 0-1)")
print("   • Adding random horizontal flips")
print("   • Splitting: 80% training, 20% validation")

# Create data generator with augmentation to prevent overfitting
data_generator = ImageDataGenerator(
    rescale=1.0 / 255.0,              # Normalize pixel values
    horizontal_flip=True,              # Random horizontal flips
    validation_split=0.2               # 20% for validation, 80% for training
)

# Load training images
training_images = data_generator.flow_from_directory(
    DATASET_DIR,
    target_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="categorical",         # Two classes: Real vs Fake
    subset="training",
    shuffle=True,
    seed=SEED
)

# Load validation images
validation_images = data_generator.flow_from_directory(
    DATASET_DIR,
    target_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    subset="validation",
    shuffle=False
)

# Show what we loaded
class_mapping = training_images.class_indices
real_images_count = training_images.samples
fake_images_count = validation_images.samples

print(f"\n✅ Data loaded successfully!")
print(f"   • Class mapping: {class_mapping}")
print(f"   • Training images: {real_images_count}")
print(f"   • Validation images: {fake_images_count}")


# ============================================================================
# STEP 3: BUILD THE MODEL
# ============================================================================

print("\n🏗️  Building neural network model...")
print("   • Base: MobileNetV2 (ImageNet weights)")
print("   • Custom classifier head for Real/Fake detection")
print("   • Dropout layers to prevent overfitting")

tf.keras.backend.clear_session()

# Load pre-trained MobileNetV2 (ImageNet weights)
# We freeze this backbone to use its learned features
backbone = MobileNetV2(
    include_top=False,
    weights="imagenet",
    input_shape=(IMAGE_SIZE[0], IMAGE_SIZE[1], 3)
)
backbone.trainable = False  # Don't train backbone, only learn new classifier head

# Build custom classifier on top of backbone
deep_learning_model = Sequential([
    backbone,
    GlobalAveragePooling2D(),           # Convert features to vector
    Dense(512, activation="relu"),      # First dense layer
    BatchNormalization(),               # Normalize layer outputs
    Dropout(0.3),                       # Drop 30% of neurons (prevent overfitting)
    Dense(128, activation="relu"),      # Second dense layer
    Dropout(0.1),                       # Drop 10% of neurons
    Dense(2, activation="softmax")      # Output: probability for Real/Fake
])

# Compile model with Adam optimizer
deep_learning_model.compile(
    optimizer="adam",
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

print("\n✅ Model architecture:")
deep_learning_model.summary()


# ============================================================================
# STEP 4: LEARNING RATE SCHEDULER
# ============================================================================

print("\n📊 Setting up learning rate schedule...")
print("   • Epochs 0-2:   High learning rate (0.001)")
print("   • Epochs 3-15:  Medium learning rate (0.0001)")
print("   • Epochs 16+:   Low learning rate (0.00001)")

def learning_rate_schedule(epoch):
    """Adjust learning rate based on epoch number"""
    if epoch <= 2:
        return 1e-3      # Start high for quick learning
    elif epoch <= 15:
        return 1e-4      # Reduce for finer adjustments
    return 1e-5          # Very small for final tweaks

lr_scheduler = tf.keras.callbacks.LearningRateScheduler(learning_rate_schedule)


# ============================================================================
# STEP 5: TRAIN THE MODEL
# ============================================================================

print("\n🎓 Training model...")
print(f"   • Epochs: {EPOCHS}")
print(f"   • Batch size: {BATCH_SIZE}")
print(f"   • This will take several minutes (or hours on CPU)...\n")

training_history = deep_learning_model.fit(
    training_images,
    epochs=EPOCHS,
    validation_data=validation_images,
    callbacks=[lr_scheduler],
    verbose=1
)


# ============================================================================
# STEP 6: SAVE THE TRAINED MODEL
# ============================================================================

print(f"\n💾 Saving trained model...")
deep_learning_model.save(MODEL_PATH)
print(f"✅ Model saved to: {MODEL_PATH}")


# ============================================================================
# STEP 7: EVALUATE MODEL PERFORMANCE
# ============================================================================

print("\n📈 Evaluating model on validation data...\n")

validation_images.reset()
predictions = deep_learning_model.predict(validation_images, verbose=0)
predicted_classes = np.argmax(predictions, axis=1)
actual_classes = validation_images.classes

# Calculate overall accuracy
validation_accuracy = np.mean(predicted_classes == actual_classes)
print(f"✅ Validation Accuracy: {validation_accuracy:.2%}")

# Show detailed metrics if sklearn is available
if has_sklearn:
    print("\n" + "─"*80)
    print("📊 DETAILED CLASSIFICATION REPORT")
    print("─"*80)
    
    print("\nConfusion Matrix:")
    confusion = confusion_matrix(actual_classes, predicted_classes)
    print(confusion)
    
    print("\nPer-Class Performance:")
    class_names = list(validation_images.class_indices.keys())
    report = classification_report(actual_classes, predicted_classes, target_names=class_names)
    print(report)
else:
    print("💡 Tip: Install scikit-learn for more detailed metrics")


# ============================================================================
# STEP 8: OPTIONAL - VISUALIZE TRAINING HISTORY
# ============================================================================

if SHOW_PLOTS:
    print("\n📊 Generating training graphs...")
    
    train_loss = training_history.history["loss"]
    val_loss = training_history.history["val_loss"]
    train_accuracy = training_history.history["accuracy"]
    val_accuracy = training_history.history["val_accuracy"]
    epochs_range = range(EPOCHS)

    # Loss graph
    plt.figure(figsize=(8, 5))
    plt.plot(epochs_range, train_loss, label="Training Loss", marker="o")
    plt.plot(epochs_range, val_loss, label="Validation Loss", marker="s")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.title("Model Loss Over Training")
    plt.legend()
    plt.grid(True)
    plt.show()

    # Accuracy graph
    plt.figure(figsize=(8, 5))
    plt.plot(epochs_range, train_accuracy, label="Training Accuracy", marker="o")
    plt.plot(epochs_range, val_accuracy, label="Validation Accuracy", marker="s")
    plt.xlabel("Epoch")
    plt.ylabel("Accuracy")
    plt.title("Model Accuracy Over Training")
    plt.legend()
    plt.grid(True)
    plt.show()


# ============================================================================
# TRAINING COMPLETE
# ============================================================================

print("\n" + "="*80)
print("✅ TRAINING COMPLETE!")
print("="*80)
print(f"\n📁 Trained model location: {MODEL_PATH}")
print("🚀 Your model is ready for predictions!")
print("\n" + "="*80 + "\n")
