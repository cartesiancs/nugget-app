# ---------------------------------------------------------------------
# Copyright (c) 2024 Qualcomm Innovation Center, Inc. All rights reserved.
# SPDX-License-Identifier: BSD-3-Clause
# ---------------------------------------------------------------------
import numpy as np
import onnxruntime
import torch


def get_onnxruntime_session_with_qnn_ep(path):
    options = onnxruntime.SessionOptions()
    session = onnxruntime.InferenceSession(
        path,
        sess_options=options,
        providers=["QNNExecutionProvider"],
        provider_options=[
            {
                "backend_path": "QnnHtp.dll",
                "htp_performance_mode": "burst",
                "high_power_saver": "sustained_high_performance",
                "enable_htp_fp16_precision": "1",
                "htp_graph_finalization_optimization_mode": "3",
            }
        ],
    )
    return session


class ONNXEncoderWrapper(torch.nn.Module):
    def __init__(self, encoder_path):
        super().__init__()
        self.session = get_onnxruntime_session_with_qnn_ep(encoder_path)

    def to(self, *args):
        return self

    def __call__(self, audio):
        # Convert tensor to numpy if needed
        if hasattr(audio, 'numpy'):
            audio = audio.numpy()
        result = self.session.run(None, {"audio": audio})
        # Convert numpy results back to torch tensors for TorchNumpyAdapter compatibility
        return [torch.from_numpy(arr) for arr in result]


class ONNXDecoderWrapper(torch.nn.Module):
    def __init__(self, decoder_path):
        super().__init__()
        self.session = get_onnxruntime_session_with_qnn_ep(decoder_path)

    def to(self, *args):
        return self

    def __call__(
        self, x, index, k_cache_cross, v_cache_cross, k_cache_self, v_cache_self
    ):
        # Convert tensors to numpy if needed
        if hasattr(x, 'numpy'):
            x = x.numpy()
        if hasattr(index, 'numpy'):
            index = index.numpy()
        if hasattr(k_cache_cross, 'numpy'):
            k_cache_cross = k_cache_cross.numpy()
        if hasattr(v_cache_cross, 'numpy'):
            v_cache_cross = v_cache_cross.numpy()
        if hasattr(k_cache_self, 'numpy'):
            k_cache_self = k_cache_self.numpy()
        if hasattr(v_cache_self, 'numpy'):
            v_cache_self = v_cache_self.numpy()
            
        result = self.session.run(
            None,
            {
                "x": x.astype(np.int32),
                "index": index,
                "k_cache_cross": k_cache_cross,
                "v_cache_cross": v_cache_cross,
                "k_cache_self": k_cache_self,
                "v_cache_self": v_cache_self,
            },
        )
        # Convert numpy results back to torch tensors for TorchNumpyAdapter compatibility
        return [torch.from_numpy(arr) for arr in result]


class WhisperBaseEnONNX:
    def __init__(self, encoder_path, decoder_path):
        self.encoder = ONNXEncoderWrapper(encoder_path)
        self.decoder = ONNXDecoderWrapper(decoder_path)
        self.num_decoder_blocks = 6
        self.num_decoder_heads = 8
        self.attention_dim = 512
        self.mean_decode_len = 224  # Updated to match ONNX model expectations
    
    def to(self, device):
        # No-op for ONNX models
        return self