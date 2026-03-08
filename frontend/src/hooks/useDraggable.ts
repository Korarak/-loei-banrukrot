import { useRef, useState, MouseEvent } from 'react';

export function useDraggable() {
    const ref = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isDown, setIsDown] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const onMouseDown = (e: MouseEvent) => {
        if (!ref.current) return;
        setIsDown(true);
        setStartX(e.pageX - ref.current.offsetLeft);
        setScrollLeft(ref.current.scrollLeft);
    };

    const onMouseLeave = () => {
        setIsDown(false);
        setIsDragging(false);
    };

    const onMouseUp = () => {
        setIsDown(false);
        // Delay resetting isDragging to allow click events to process if needed, 
        // but pointer-events control is usually immediate. 
        // We reset it here.
        setTimeout(() => setIsDragging(false), 0);
    };

    const onMouseMove = (e: MouseEvent) => {
        if (!isDown || !ref.current) return;
        e.preventDefault();
        const x = e.pageX - ref.current.offsetLeft;
        const walk = (x - startX) * 2; // Scroll-fast

        // Only set dragging if moved more than 5px to distinguish from click
        if (Math.abs(x - startX) > 5) {
            setIsDragging(true);
            ref.current.scrollLeft = scrollLeft - walk;
        }
    };

    return {
        ref,
        events: {
            onMouseDown,
            onMouseLeave,
            onMouseUp,
            onMouseMove,
        },
        isDragging
    };
}
