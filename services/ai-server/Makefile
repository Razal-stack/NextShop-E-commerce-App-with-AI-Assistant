# Universal Makefile for NextShop AI Inference Server
# Works on Windows, Mac, Linux

PYTHON ?= python3
VENV_DIR = venv
REQ_FILE = requirements.txt

.PHONY: help check-ram venv install run clean

help:
	@echo "Available targets:"
	@echo "  make check-ram   # Check system RAM (Windows/Mac/Linux)"
	@echo "  make venv        # Create Python virtual environment"
	@echo "  make install     # Install Python dependencies"
	@echo "  make run         # Start the AI server"
	@echo "  make clean       # Remove virtual environment"

check-ram:
	@echo "Checking RAM..."
	@if [ "$(OS)" = "Windows_NT" ]; then \
		systeminfo | findstr /C:"Total Physical Memory"; \
	else \
		free -h; \
	fi

venv:
	@echo "Creating virtual environment..."
	$(PYTHON) -m venv $(VENV_DIR)

install:
	@echo "Upgrading pip and installing dependencies..."
	$(VENV_DIR)/Scripts/pip install --upgrade pip || $(VENV_DIR)/bin/pip install --upgrade pip
	$(VENV_DIR)/Scripts/pip install -r $(REQ_FILE) || $(VENV_DIR)/bin/pip install -r $(REQ_FILE)

run:
	@echo "Starting AI server..."
	$(VENV_DIR)/Scripts/python main.py || $(VENV_DIR)/bin/python main.py

clean:
	@echo "Removing virtual environment..."
	rm -rf $(VENV_DIR)
