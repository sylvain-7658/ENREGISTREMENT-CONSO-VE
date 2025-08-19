import React, { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface AccordionProps {
  title: ReactNode;
  children: ReactNode;
  icon?: React.ReactNode;
  startOpen?: boolean;
}

const Accordion = ({ title, children, icon, startOpen = false }: AccordionProps) => {
  const [isOpen, setIsOpen] = useState(startOpen);

  return (
    <div className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full py-4 text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
            {icon && <div className="text-slate-500">{icon}</div>}
            <span className="text-lg font-semibold text-slate-700 dark:text-slate-200">{title}</span>
        </div>
        <ChevronDown
          size={20}
          className={`transform transition-transform duration-300 text-slate-500 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.section
            key="content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: 'auto' },
              collapsed: { opacity: 0, height: 0 },
            }}
            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="pb-6 pt-2">{children}</div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Accordion;