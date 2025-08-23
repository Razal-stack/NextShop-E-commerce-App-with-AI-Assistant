"""
Production-grade logging system with structured logging, rotation, and performance monitoring.
"""
import sys
import logging
import json
from pathlib import Path
from typing import Any, Dict, Optional
from datetime import datetime
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler


class StructuredFormatter(logging.Formatter):
    """
    Structured JSON formatter for production logging.
    Enables better log analysis and monitoring.
    """
    
    def format(self, record: logging.LogRecord) -> str:
        # Create structured log entry
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields if present
        if hasattr(record, "extra_fields"):
            log_entry.update(record.extra_fields)
        
        # Add performance metrics if present
        if hasattr(record, "duration_ms"):
            log_entry["duration_ms"] = record.duration_ms
        
        if hasattr(record, "model_name"):
            log_entry["model_name"] = record.model_name
            
        if hasattr(record, "request_id"):
            log_entry["request_id"] = record.request_id
        
        return json.dumps(log_entry, ensure_ascii=False)


class PerformanceLogger:
    """
    Context manager for performance logging.
    """
    
    def __init__(self, logger: logging.Logger, operation: str, **kwargs):
        self.logger = logger
        self.operation = operation
        self.extra_fields = kwargs
        self.start_time = None
    
    def __enter__(self):
        self.start_time = datetime.utcnow()
        self.logger.info(
            f"Starting {self.operation}",
            extra={"extra_fields": {**self.extra_fields, "operation": self.operation}}
        )
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.start_time:
            duration = (datetime.utcnow() - self.start_time).total_seconds() * 1000
            
            if exc_type is None:
                self.logger.info(
                    f"Completed {self.operation}",
                    extra={
                        "duration_ms": round(duration, 2),
                        "extra_fields": {**self.extra_fields, "operation": self.operation}
                    }
                )
            else:
                self.logger.error(
                    f"Failed {self.operation}: {exc_val}",
                    extra={
                        "duration_ms": round(duration, 2),
                        "extra_fields": {**self.extra_fields, "operation": self.operation}
                    },
                    exc_info=True
                )


def setup_logger(settings) -> logging.Logger:
    """
    Setup production-grade logging with multiple handlers and structured output.
    """
    
    # Create root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, settings.LOG_LEVEL))
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Console handler with colored output for development
    console_handler = logging.StreamHandler(sys.stdout)
    console_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    console_handler.setFormatter(console_formatter)
    console_handler.setLevel(getattr(logging, settings.LOG_LEVEL))
    root_logger.addHandler(console_handler)
    
    # File handler with rotation for production
    if settings.LOG_FILE:
        log_file_path = Path(settings.LOG_FILE)
        log_file_path.parent.mkdir(exist_ok=True)
        
        # Use TimedRotatingFileHandler for daily rotation
        file_handler = TimedRotatingFileHandler(
            filename=str(log_file_path),
            when='midnight',
            interval=1,
            backupCount=30,  # Keep 30 days of logs
            encoding='utf-8',
            utc=True
        )
        
        # Use structured JSON formatter for file logs
        file_handler.setFormatter(StructuredFormatter())
        file_handler.setLevel(logging.INFO)  # File logs always INFO+
        root_logger.addHandler(file_handler)
    
    # Error file handler for critical issues
    if settings.LOG_FILE:
        error_log_path = log_file_path.parent / "errors.log"
        error_handler = RotatingFileHandler(
            filename=str(error_log_path),
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(StructuredFormatter())
        root_logger.addHandler(error_handler)
    
    # Performance logger
    perf_logger = logging.getLogger("performance")
    if settings.LOG_FILE:
        perf_log_path = log_file_path.parent / "performance.log"
        perf_handler = TimedRotatingFileHandler(
            filename=str(perf_log_path),
            when='midnight',
            interval=1,
            backupCount=7,  # Keep 1 week of performance logs
            encoding='utf-8',
            utc=True
        )
        perf_handler.setFormatter(StructuredFormatter())
        perf_logger.addHandler(perf_handler)
    
    # Configure specific loggers
    
    # Silence noisy libraries
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("transformers").setLevel(logging.WARNING)
    
    # AI Server specific logger
    ai_logger = logging.getLogger("ai_server")
    ai_logger.setLevel(getattr(logging, settings.LOG_LEVEL))
    
    return root_logger


def get_logger(name: str) -> logging.Logger:
    """Get a configured logger instance"""
    return logging.getLogger(name)


def setup_logging(settings=None):
    """
    Setup logging using provided or default settings.
    This is a convenience function that calls setup_logger with settings.
    """
    if settings is None:
        from app.core.config import get_settings
        settings = get_settings()
    return setup_logger(settings)


def log_model_operation(logger: logging.Logger, operation: str, model_name: Optional[str] = None, **kwargs):
    """Helper function for logging model operations"""
    return PerformanceLogger(
        logger=logger,
        operation=operation,
        model_name=model_name,
        **kwargs
    )


def log_request(logger: logging.Logger, request_id: str, endpoint: str, **kwargs):
    """Helper function for logging API requests"""
    return PerformanceLogger(
        logger=logger,
        operation=f"API {endpoint}",
        request_id=request_id,
        **kwargs
    )
