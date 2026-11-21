CREATE TABLE greetings (
    unique_token TEXT PRIMARY KEY NOT NULL,
    sender_name TEXT NOT NULL CHECK (length(sender_name) BETWEEN 1 AND 80),
    recipient_name TEXT NOT NULL CHECK (length(recipient_name) BETWEEN 1 AND 80),
    occasion TEXT NOT NULL CHECK (occasion IN ('christmas', 'new_year', 'both')),
    greeting_style TEXT NOT NULL CHECK (
        greeting_style IN (
            'heartwarming',
            'romantic',
            'funny',
            'inspirational',
            'spiritual',
            'professional',
            'family'
        )
    ),
    personal_note TEXT NOT NULL CHECK (length(personal_note) BETWEEN 1 AND 400),
    parent_token TEXT REFERENCES greetings(unique_token) ON DELETE SET NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX greetings_parent_created_at_idx
    ON greetings (parent_token, created_at);
