import React, { useState, useEffect } from 'react';
import { animateScroll as scroll } from 'react-scroll'
import { ArrowUp } from 'lucide-react';

const ScrollToTopButton = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            setVisible(window.scrollY > 300);
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        scroll.scrollToTop({
            duration: 500,
            smooth: true,
        });
    };

    return (
        visible && (
            <button
                onClick={scrollToTop}
                className='scroll-to-top bg-qut-light-blue hover:bg-qut-blue'
                aria-label='Scroll to top'
            >
                <ArrowUp size={20} />
            </button>
        )
    )
}

export default ScrollToTopButton;