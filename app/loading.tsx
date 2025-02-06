'use client';

import React, { useState, useEffect } from 'react';
import MinimalistLoader from './components/Loader';

export default function Loading() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((prevProgress) => {

                if (prevProgress >= 100) {
                    clearInterval(timer);
                    return 100;
                }
                return prevProgress + 10;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return <MinimalistLoader progress={progress} />;
}