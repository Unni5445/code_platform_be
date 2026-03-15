import { useEffect, useRef } from "react";

export default function useCustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const outlineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const outline = outlineRef.current;
    if (!dot || !outline || !window.matchMedia("(pointer: fine)").matches) return;

    document.body.style.cursor = "none";

    let outlineX = window.innerWidth / 2;
    let outlineY = window.innerHeight / 2;
    let targetX = outlineX;
    let targetY = outlineY;
    let cursorScale = 1;
    let animId: number;

    const onMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      dot.style.transform = `translate(${clientX}px, ${clientY}px) translate(-50%, -50%)`;
      targetX = clientX;
      targetY = clientY;
    };

    function animateOutline() {
      const speed = 0.16;
      outlineX += (targetX - outlineX) * speed;
      outlineY += (targetY - outlineY) * speed;
      outline!.style.transform = `translate(${outlineX}px, ${outlineY}px) translate(-50%, -50%) scale(${cursorScale})`;
      animId = requestAnimationFrame(animateOutline);
    }

    document.addEventListener("mousemove", onMouseMove);
    animId = requestAnimationFrame(animateOutline);

    const interactiveEls = document.querySelectorAll("a, button");
    const onEnter = () => { cursorScale = 1.45; };
    const onLeave = () => { cursorScale = 1; };

    interactiveEls.forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    return () => {
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(animId);
      interactiveEls.forEach((el) => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
    };
  }, []);

  return { dotRef, outlineRef };
}
