from __future__ import annotations

import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2
from tensorflow.keras.layers import BatchNormalization, Dense, Dropout, GlobalAveragePooling2D
from tensorflow.keras.models import Sequential


def build_classifier(
    image_size: tuple[int, int],
    *,
    backbone_weights: str | None = "imagenet",
) -> tuple[Sequential, tf.keras.Model]:
    """Build the shared classifier architecture used by training and inference."""
    backbone = MobileNetV2(
        include_top=False,
        weights=backbone_weights,
        input_shape=(image_size[0], image_size[1], 3),
    )
    backbone.trainable = False

    model = Sequential(
        [
            backbone,
            GlobalAveragePooling2D(),
            Dense(512, activation="relu"),
            BatchNormalization(),
            Dropout(0.3),
            Dense(128, activation="relu"),
            Dropout(0.2),
            Dense(2, activation="softmax"),
        ]
    )
    model(tf.zeros((1, image_size[0], image_size[1], 3), dtype=tf.float32))
    return model, backbone
