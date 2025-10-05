import React from 'react';
import './Avatar.css';

const Avatar = ({ type, selected = false, onClick }) => {
    const renderAvatar = () => {
        switch (type) {
            case 'ai':
                return (
                    <div className="avatar-container ai-avatar">
                        <div className="avatar-head">
                            <div className="ai-eyes">
                                <div className="eye left-eye"></div>
                                <div className="eye right-eye"></div>
                            </div>
                            <div className="ai-circuits">
                                <div className="circuit circuit-1"></div>
                                <div className="circuit circuit-2"></div>
                                <div className="circuit circuit-3"></div>
                            </div>
                        </div>
                        <div className="avatar-body">
                            <div className="ai-core"></div>
                        </div>
                    </div>
                );
            
            case 'money':
                return (
                    <div className="avatar-container money-avatar">
                        <div className="avatar-head">
                            <div className="money-eyes">
                                <div className="eye left-eye"></div>
                                <div className="eye right-eye"></div>
                            </div>
                            <div className="money-symbol">$</div>
                        </div>
                        <div className="avatar-body">
                            <div className="coins">
                                <div className="coin coin-1"></div>
                                <div className="coin coin-2"></div>
                                <div className="coin coin-3"></div>
                            </div>
                        </div>
                    </div>
                );
            
            case 'tech':
                return (
                    <div className="avatar-container tech-avatar">
                        <div className="avatar-head">
                            <div className="tech-eyes">
                                <div className="eye left-eye"></div>
                                <div className="eye right-eye"></div>
                            </div>
                            <div className="tech-glasses">
                                <div className="glass left-glass"></div>
                                <div className="glass right-glass"></div>
                            </div>
                        </div>
                        <div className="avatar-body">
                            <div className="tech-pattern">
                                <div className="pattern-line line-1"></div>
                                <div className="pattern-line line-2"></div>
                                <div className="pattern-line line-3"></div>
                            </div>
                        </div>
                    </div>
                );
            
            case 'trading':
                return (
                    <div className="avatar-container trading-avatar">
                        <div className="avatar-head">
                            <div className="trading-eyes">
                                <div className="eye left-eye"></div>
                                <div className="eye right-eye"></div>
                            </div>
                            <div className="trading-chart">
                                <div className="chart-line"></div>
                                <div className="chart-points">
                                    <div className="point point-1"></div>
                                    <div className="point point-2"></div>
                                    <div className="point point-3"></div>
                                    <div className="point point-4"></div>
                                </div>
                            </div>
                        </div>
                        <div className="avatar-body">
                            <div className="trading-symbols">
                                <div className="trend-up">↗</div>
                                <div className="trend-down">↘</div>
                            </div>
                        </div>
                    </div>
                );
            
            default:
                return null;
        }
    };

    return (
        <div 
            className={`avatar-option ${selected ? 'selected' : ''}`}
            onClick={onClick}
        >
            {renderAvatar()}
        </div>
    );
};

export default Avatar;