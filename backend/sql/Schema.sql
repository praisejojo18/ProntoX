-- Create database
CREATE DATABASE IF NOT EXISTS prontox_db;
USE prontox_db;

-- Users
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    points INT DEFAULT 0,
    avatar_url VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Ideas
CREATE TABLE IF NOT EXISTS ideas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    problem TEXT NOT NULL,
    solution TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    status ENUM('submitted', 'review', 'approved', 'implemented') DEFAULT 'submitted',
    is_anonymous BOOLEAN DEFAULT FALSE,
    score INT DEFAULT NULL,
    feedback TEXT NULL,
    outcome_note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_category (category)
);

-- Votes
CREATE TABLE IF NOT EXISTS votes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    idea_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vote (user_id, idea_id),
    INDEX idx_idea_id (idea_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    idea_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE CASCADE,
    INDEX idx_idea_id (idea_id)
);

-- Points log
CREATE TABLE IF NOT EXISTS points_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    points INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- Rewards
CREATE TABLE IF NOT EXISTS rewards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    points_cost INT NOT NULL,
    icon VARCHAR(50) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Redemptions
CREATE TABLE IF NOT EXISTS redemptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    reward_id INT NOT NULL,
    points_spent INT NOT NULL,
    status ENUM('pending', 'approved', 'fulfilled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fulfilled_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reward_id) REFERENCES rewards(id),
    INDEX idx_user_id (user_id)
);

-- Default rewards
INSERT INTO rewards (name, description, points_cost, icon) VALUES
('Extra Day Off', 'Take an extra day off on us. Recharge and come back stronger.', 5000, 'ph-calendar-blank'),
('Certification Exams', 'Get certified in your field. We\'ll cover the exam fees for you.', 2000, 'ph-certificate'),
('Redeem to Cash', 'Turn your points into real money. Withdraw directly to your account.', 1000, 'ph-currency-dollar');

SELECT * 
FROM point_logs ;