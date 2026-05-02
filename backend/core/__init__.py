"""Shared infrastructure for the New UI backend.

Modules:
    quest.py           — QuestDB connection + row-shaping helpers
    grading.py         — score-to-grade thresholds
    state.py           — process-wide caches
    circuit_breaker.py — failure-isolation wrapper for external resources
"""
