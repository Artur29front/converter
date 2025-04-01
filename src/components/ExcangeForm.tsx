import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ExchangeForm.css';

interface ApiResponse {
    inAmount: number;
    outAmount: number;
    isStraight: boolean;
    price: [string, string];
}

const ExchangeForm = () => {
    // Константы из ТЗ
    const API_URL = 'https://awx.pro/b2api/change/user/pair/calc';
    const API_HEADERS = { serial: 'a7307e89-fbeb-4b28-a8ce-55b7fb3c32aa' };
    const PAIR_ID = 133;
    const LEFT_MIN = 10000;
    const LEFT_MAX = 70000000;
    const LEFT_STEP = 100;

    // Состояния
    const [leftValue, setLeftValue] = useState<string>(LEFT_MIN.toString());
    const [rightValue, setRightValue] = useState<string>('0');
    const [price, setPrice] = useState<[number, number]>([1, 1]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const lastRequestTime = useRef<number>(0);

    // Проверка допустимости значения для левого инпута
    const isValidLeftValue = useCallback((value: number) => {
        return value >= LEFT_MIN && value <= LEFT_MAX && value % LEFT_STEP === 0;
    }, []);

    // Проверка допустимости значения для правого инпута
    const isValidRightValue = useCallback((value: number) => {
        return value >= 0;
    }, []);

    // Форматирование числа с учетом Decimal
    const formatDecimal = (value: number, precision: number) => {
        return value.toFixed(precision).replace(/\.?0+$/, '');
    };

    // Запрос к API с защитой от превышения лимита
    const fetchExchangeRate = useCallback(async () => {
        const now = Date.now();
        if (now - lastRequestTime.current < 1000) return;

        setIsLoading(true);
        lastRequestTime.current = now;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...API_HEADERS
                },
                body: JSON.stringify({
                    pairId: PAIR_ID,
                    inAmount: 1,
                    outAmount: null
                })
            });

            if (!response.ok) throw new Error(`API error: ${response.status}`);

            const data: ApiResponse = await response.json();
            const parsedPrice: [number, number] = [
                parseFloat(data.price[0]),
                parseFloat(data.price[1])
            ];
            setPrice(parsedPrice);

            // Обновляем правое значение при получении нового курса
            const leftNum = parseFloat(leftValue);
            if (!isNaN(leftNum) {
                setRightValue(formatDecimal(leftNum * parsedPrice[1], 6));
            }
        } catch (error) {
            console.error('Failed to fetch exchange rate:', error);
        } finally {
            setIsLoading(false);
        }
    }, [leftValue]);

    // Эффект для периодического обновления курса
    useEffect(() => {
        const interval = setInterval(() => {
            fetchExchangeRate();
        }, 1000);

        // Первоначальный запрос
        fetchExchangeRate();

        return () => clearInterval(interval);
    }, [fetchExchangeRate]);

    // Обработчик изменения левого инпута
    const handleLeftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const num = parseFloat(value);

        if (value === '' || isNaN(num)) {
            setLeftValue(LEFT_MIN.toString());
            setRightValue('0');
            return;
        }

        if (isValidLeftValue(num)) {
            setLeftValue(value);
            setRightValue(formatDecimal(num * price[1], 6));
        }
    };

    // Обработчик изменения правого инпута
    const handleRightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const num = parseFloat(value);

        if (value === '' || isNaN(num)) {
            setRightValue('0');
            setLeftValue(LEFT_MIN.toString());
            return;
        }

        if (isValidRightValue(num)) {
            setRightValue(value);
            const convertedValue = num / price[1];
            if (isValidLeftValue(convertedValue)) {
                setLeftValue(convertedValue.toString());
            }
        }
    };

    // Расчет прогресса для шкалы
    const progress = ((parseFloat(leftValue) - LEFT_MIN) / (LEFT_MAX - LEFT_MIN)) * 100;

    return (
        <div className="exchange-form">
            <div className="input-container">
                <input
                    type="number"
                    min={LEFT_MIN}
                    max={LEFT_MAX}
                    step={LEFT_STEP}
                    value={leftValue}
                    onChange={handleLeftChange}
                    disabled={isLoading}
                    className="exchange-input"
                    aria-label="Left exchange input"
                />
            </div>

            <div className="input-container">
                <input
                    type="number"
                    min={0}
                    step={0.000001}
                    value={rightValue}
                    onChange={handleRightChange}
                    disabled={isLoading}
                    className="exchange-input"
                    aria-label="Right exchange input"
                />
            </div>

            <div className="progress-bar-container">
                <div
                    className="progress-bar"
                    style={{ width: `${progress}%` }}
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                ></div>
            </div>
        </div>
    );
};

export default ExchangeForm;