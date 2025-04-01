import React, { useState, useEffect, useRef } from "react";
import styles from './ExchangeForm.module.css';

const API_URL = "/b2api/change/user/pair/calc";
const API_HEADERS = { serial: "a7307e89-fbeb-4b28-a8ce-55b7fb3c32aa" };
const PAIR_ID = 133;
const REQUEST_INTERVAL = 1000;
const RUB_MIN = 10000;
const RUB_MAX = 70000000;
const RUB_STEP = 100;
const USDT_STEP = 0.000001;
const USDT_MAX = 1000000;
const USDT_MIN = 0;

const ExchangeForm = () => {
    const [rubValue, setRubValue] = useState("100");
    const [usdtValue, setUsdtValue] = useState("");
    const [price, setPrice] = useState([1, 1]);
    const isUserTyping = useRef(false);

    const formatDecimal = (value: string, decimals: number): string => {
        let num = parseFloat(value);
        if (isNaN(num)) return value;

        return num.toFixed(decimals).replace(/\.?0+$/, '');
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (!isUserTyping.current) {
                fetchExchangeRate();
            }
        }, REQUEST_INTERVAL);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!isUserTyping.current && price[1]) {
            const num = parseFloat(rubValue);
            if (!isNaN(num)) {
                setUsdtValue(formatDecimal((num * price[1]).toString(), 6));
            }
        }
    }, [rubValue, price]);

    const fetchExchangeRate = async () => {
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...API_HEADERS },
                body: JSON.stringify({ pairId: PAIR_ID, inAmount: 1, outAmount: null }),
                mode: "cors",
            });

            if (!response.ok) throw new Error(`Ошибка: ${response.status}`);

            const data = await response.json();

            setPrice([parseFloat(data.price[0]), parseFloat(data.price[1])]);
        } catch (error) {
            console.error("API error", error);
        }
    };

    const handleRubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        if (!/^-?\d*\.?\d*$/.test(value)) return;
        if ((value.match(/\./g) || []).length > 1) return;
        if (value.indexOf('-') > 0) return;

        setRubValue(value);
        isUserTyping.current = true;

        const num = parseFloat(value);
        if (!isNaN(num) && num >= RUB_MIN && num <= RUB_MAX) {
            setUsdtValue(formatDecimal((num * price[1]).toString(), 6));
        }
    };

    const handleUsdtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        if (!/^-?\d*\.?\d*$/.test(value)) return;
        if ((value.match(/\./g) || []).length > 1) return;
        if (value.indexOf('-') > 0) return;

        setUsdtValue(value);
        isUserTyping.current = true;

        const num = parseFloat(value);
        if (!isNaN(num) && num >= USDT_MIN && num <= USDT_MAX) {
            const converted = num / price[1];
            setRubValue(formatDecimal(converted.toString(), 2));
        }
    };
    const handleBlur = () => {
        isUserTyping.current = false;

        const rubNum = parseFloat(rubValue);
        const usdtNum = parseFloat(usdtValue);

        if (isNaN(rubNum) || rubNum < 10) {
            setRubValue("10000");
        } else if (rubNum > 70000000) {
            setRubValue("70000000");
        }

        if (isNaN(usdtNum) || usdtNum < 0) {
            setUsdtValue(formatDecimal((rubNum * price[1]).toString(), 6));        }
    };

    const calculaterubProgress = () => {
        const value = parseFloat(usdtValue) || RUB_MIN;
        return ((value - RUB_MIN) / (RUB_MAX - RUB_MIN)) * 100;
    };

    const calculateusdtProgress = () => {
        const value = parseFloat(rubValue) || USDT_MIN;
        return ((value - USDT_MIN) / (USDT_MAX - USDT_MIN)) * 100;
    };

    const handleusdtSegmentClick = (percentage: number) => {
        const newValue = USDT_MIN + (USDT_MAX - USDT_MIN) * (percentage / 100);
        setRubValue(Math.round(newValue).toString());
        setUsdtValue((newValue * price[1]).toFixed(6));
        isUserTyping.current = false;
    };

    const handlerubSegmentClick = (percentage: number) => {
        const newValue = RUB_MIN + (RUB_MAX - RUB_MIN) * (percentage / 100);
        setUsdtValue(newValue.toFixed(6));
        setRubValue((newValue / price[1]).toFixed(2));
        isUserTyping.current = false;
    };

    const renderrubProgressSegments = () => {
        const progress = calculaterubProgress();

        return [25, 50, 75, 100].map((segmentValue) => (
            <Segment
                key={`rub-${segmentValue}`}
                segmentValue={segmentValue}
                progress={progress}
                onClick={() => handlerubSegmentClick(segmentValue)}
            />
        ));
    };

    const renderusdtProgressSegments = () => {
        const progress = calculateusdtProgress();

        return [25, 50, 75, 100].map((segmentValue) => (
            <Segment
                key={`usdt-${segmentValue}`}
                segmentValue={segmentValue}
                progress={progress}
                onClick={() => handleusdtSegmentClick(segmentValue)}
            />
        ));
    };
    return (
        <form className={styles.container}>
                <div className={styles.col}>
                    <div className={styles.inputWrapper}>
                        <input
                            id="rub"
                            type="text"
                            inputMode="decimal"
                            className="exchange-input"
                            value={usdtValue}
                            onChange={handleUsdtChange}
                            onBlur={handleBlur}
                            onFocus={() => isUserTyping.current = true}
                            max={RUB_MAX}
                            min={RUB_MIN}
                            step={RUB_STEP}
                        />
                        <label htmlFor="rub">RUB</label>
                    </div>

                    <div className={styles.progressBar}>
                        {renderrubProgressSegments()}
                    </div>

                </div>

                <div className={styles.col}>
                    <div className={styles.inputWrapper}>
                        <input
                            id="usdt"
                            type="text"
                            inputMode="decimal"
                            className="exchange-input"
                            value={rubValue}
                            onChange={handleRubChange}
                            onBlur={handleBlur}
                            onFocus={() => isUserTyping.current = true}
                            max={USDT_MAX}
                            min={USDT_MIN}
                            step={USDT_STEP}
                        />
                        <label htmlFor="usdt">USDT</label>
                    </div>

                    <div className={styles.progressBar}>
                        {renderusdtProgressSegments()}
                    </div>
                </div>
        </form>
    );
};

const Segment: React.FC<{
    segmentValue: number;
    progress: number;
    onClick: () => void;
}> = ({ segmentValue, progress, onClick }) => {
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

export default ExchangeForm;