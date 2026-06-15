"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";

interface SpatialLayerProps {
  children: React.ReactNode;
  depth?: -100 | -50 | 0 | 20 | 40 | 60 | 80 | 100;
  className?: string;
  parallaxSpeed?: number;
}

/**
 * SpatialLayer provides a Z-axis depth separation.
 * It also supports optional parallax motion relative to scroll.
 */
export const SpatialLayer = ({ children, depth = 0, className = "", parallaxSpeed = 0 }: SpatialLayerProps) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };
  const yOffset = useTransform(scrollYProgress, [0, 1], [parallaxSpeed * 100, parallaxSpeed * -100]);
  const y = useSpring(yOffset, springConfig);

  return (
    <motion.div
      ref={ref}
      style={{ 
        y: parallaxSpeed !== 0 ? y : 0,
      }}
      className={`spatial-layer ${className}`}
    >
      {children}
    </motion.div>
  );
};

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "none";
}

/**
 * ScrollReveal handles the cinematic reveal of sections or elements.
 * Works bi-directionally by default (once: false).
 */
export const ScrollReveal = ({ children, className = "", delay = 0, direction = "up" }: ScrollRevealProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: "-10% 0px -10% 0px", once: false });

  const variants = {
    hidden: { 
      opacity: 0, 
      y: direction === "up" ? 40 : direction === "down" ? -40 : 0,
      scale: 0.98,
      filter: "blur(10px)"
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 1.2,
        delay,
        ease: [0.16, 1, 0.3, 1] as any
      }
    }
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      className={`scroll-reveal ${className}`}
      style={{ transformStyle: "flat" }}
    >
      {children}
    </motion.div>
  );
};

interface ParallaxWrapperProps {
  children: React.ReactNode;
  speed?: number; // 0.7 to 1.1 recommended
  className?: string;
}

/**
 * ParallaxWrapper for background or floating elements.
 * speed < 1: moves slower than scroll (background)
 * speed > 1: moves faster than scroll (foreground)
 */
export const ParallaxWrapper = ({ children, speed = 1, className = "" }: ParallaxWrapperProps) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Calculate relative motion based on speed
  // A speed of 1 is neutral. 
  // 0.7 means it moves 30% slower.
  // 1.1 means it moves 10% faster.
  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };
  const yRange = (1 - speed) * 200;
  const yOffset = useTransform(scrollYProgress, [0, 1], [yRange, -yRange]);
  const y = useSpring(yOffset, springConfig);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
};
