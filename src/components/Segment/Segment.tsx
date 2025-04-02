import React, {FC} from "react";
import styles from "../ExchangeForm/ExchangeForm.module.css";

interface SegmentProps{
    segmentValue: number;
    progress: number;
    onClick: () => void;
}

const Segment: FC<SegmentProps> = ({segmentValue, progress, onClick}) => {
    const segmentProgress = Math.min(100, Math.max(0, ((progress - (segmentValue - 25)) / 25) * 100));
    const isActive = progress >= segmentValue;
    const isPartial = progress > segmentValue - 25 && !isActive;

    return (
        <button
            className={styles.segment}
            onClick={onClick}
            type="button"
        >
            <div
                className={styles.progressOverlay}
                style={{
                    width: isActive ? '100%' : isPartial ? `${segmentProgress}%` : '0%',
                    backgroundColor: isActive || isPartial ? '#168ACD' : '#ffffff'
                }}
            />
            <span style={{
                backgroundImage: isActive || isPartial ?
                    `linear-gradient(90deg, white ${segmentProgress}%, gray ${segmentProgress}%)` :
                    'gray',
                padding: '0',
                color: isActive ? 'white' : isPartial ? 'transparent' : 'gray',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text'
            }}>
                {segmentValue}%
            </span>
        </button>
    );
};

export default Segment