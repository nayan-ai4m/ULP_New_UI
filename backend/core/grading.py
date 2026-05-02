"""Score-to-grade thresholds. Must stay in sync with the frontend's
`src/lib/quality.ts` so server-side and client-side grades match.

    ≥ 0.75 → green  (good)
    ≥ 0.60 → amber  (warning)
    < 0.60 → red    (critical)
"""

from __future__ import annotations

from typing import Optional

GRADE_GREEN_THRESHOLD = 0.75
GRADE_AMBER_THRESHOLD = 0.60


def grade_for(score: Optional[float]) -> str:
    if score is None:
        return "red"
    if score >= GRADE_GREEN_THRESHOLD:
        return "green"
    if score >= GRADE_AMBER_THRESHOLD:
        return "amber"
    return "red"
