/**
 * AutoTranslate – Universal DOM-Level Translation Layer
 * 
 * Intercepts ALL rendered text nodes across the entire React component tree 
 * and translates them through the existing centralEngine.t() function.
 * 
 * This bridges the gap for components that have NOT been individually wired 
 * to useTranslation(), AND catches fallback English text from components that
 * DO use useTranslation() but whose keys aren't in the CRITICAL_CATALOG.
 * 
 * Architecture:
 *   LanguageContext → AutoTranslate (MutationObserver) → centralEngine.t()
 *   → CRITICAL_CATALOG / memory cache / async IndicTrans2 API
 *   → DOM text node replacement → reactive re-translation on language change
 */

import { useEffect, useRef, useCallback } from "react";
import { useLanguage } from "./LanguageContext.jsx";
import { t as translateSync } from "./centralEngine.js";

// Elements whose text content should NOT be translated
const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "KBD", "SAMP",
  "SVG", "MATH", "CANVAS", "VIDEO", "AUDIO", "IFRAME", "OBJECT"
]);

// Input elements where we translate attributes, not value
const INPUT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT", "OPTION"]);

// Attributes that contain translatable text
const TRANSLATABLE_ATTRS = ["placeholder", "title", "aria-label", "alt"];

// WeakMap to store original English text for each node
const originalTextMap = new WeakMap();

// Track attribute originals: node → { attrName: originalValue }
const originalAttrMap = new WeakMap();

/**
 * Check if a text string looks like translatable content
 */
function isTranslatableText(text) {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  if (trimmed.length < 2) return false;
  
  // Skip if purely numeric / currency / date-like / symbolic
  if (/^[\d₹$€¥%.,:/\-–—\s()+*#@!?|&=\[\]{}\\<>^~`]+$/.test(trimmed)) return false;
  
  // Skip URLs
  if (/^(https?:\/\/|www\.|\/\/)/.test(trimmed)) return false;
  
  // Skip email addresses
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return false;
  
  // Skip hex colors
  if (/^#[0-9a-f]{3,8}$/i.test(trimmed)) return false;
  
  // Skip emoji-only content
  if (/^[\p{Emoji_Presentation}\p{Emoji}\s]+$/u.test(trimmed) && !/[a-zA-Z]/.test(trimmed)) return false;
  
  // Must contain at least one Latin letter (English) to be worth translating
  if (!/[a-zA-Z]/.test(trimmed)) return false;
  
  // Skip if already in a non-Latin Indic script (already translated)
  const indicRanges = /[\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]/;
  if (indicRanges.test(trimmed)) {
    // If the text is primarily Indic (more Indic chars than Latin), skip it
    const indicCount = (trimmed.match(/[\u0900-\u0D7F]/g) || []).length;
    const latinCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
    if (indicCount > latinCount) return false;
  }
  
  // Skip Urdu/Arabic script dominated text
  if (/[\u0600-\u06FF]/.test(trimmed)) {
    const arabicCount = (trimmed.match(/[\u0600-\u06FF]/g) || []).length;
    const latinCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
    if (arabicCount > latinCount) return false;
  }

  return true;
}

/**
 * Check if an element or its ancestors should be skipped
 */
function shouldSkipElement(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
  
  let el = element;
  let depth = 0;
  while (el && el !== document.body && depth < 20) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (INPUT_TAGS.has(el.tagName)) return true;
    // Skip elements explicitly marked as no-translate
    if (el.dataset?.noTranslate === "true") return true;
    if (el.classList?.contains("no-translate")) return true;
    // Skip contenteditable areas
    if (el.getAttribute?.("contenteditable") === "true") return true;
    el = el.parentElement;
    depth++;
  }
  return false;
}

/**
 * Translate a single text node
 */
function translateTextNode(node, lang) {
  if (!node || node.nodeType !== Node.TEXT_NODE) return;
  
  const parent = node.parentElement;
  if (!parent || shouldSkipElement(parent)) return;
  
  const currentText = node.textContent;
  if (!currentText || !currentText.trim()) return;
  
  const trimmed = currentText.trim();
  
  // Store original English text on first encounter
  if (!originalTextMap.has(node)) {
    if (isTranslatableText(trimmed)) {
      originalTextMap.set(node, trimmed);
    } else {
      return;
    }
  }
  
  const originalText = originalTextMap.get(node);
  if (!originalText) return;
  
  if (lang === "en") {
    // Restore original English text (preserve whitespace structure)
    const leading = currentText.match(/^(\s*)/)?.[1] || "";
    const trailing = currentText.match(/(\s*)$/)?.[1] || "";
    if (node.textContent !== leading + originalText + trailing) {
      node.textContent = leading + originalText + trailing;
    }
    return;
  }
  
  // Translate through centralEngine
  const translated = translateSync(originalText, {}, lang);
  
  if (translated && translated !== currentText.trim()) {
    const leading = currentText.match(/^(\s*)/)?.[1] || "";
    const trailing = currentText.match(/(\s*)$/)?.[1] || "";
    node.textContent = leading + translated + trailing;
  }
}

/**
 * Translate attributes (placeholder, title, aria-label, alt) on an element
 */
function translateElementAttrs(element, lang) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return;
  if (SKIP_TAGS.has(element.tagName)) return;
  
  for (const attr of TRANSLATABLE_ATTRS) {
    const value = element.getAttribute(attr);
    if (!value || !isTranslatableText(value)) continue;
    
    // Store original
    if (!originalAttrMap.has(element)) {
      originalAttrMap.set(element, {});
    }
    const attrStore = originalAttrMap.get(element);
    if (!(attr in attrStore)) {
      attrStore[attr] = value;
    }
    
    const originalValue = attrStore[attr];
    
    if (lang === "en") {
      if (element.getAttribute(attr) !== originalValue) {
        element.setAttribute(attr, originalValue);
      }
      continue;
    }
    
    const translated = translateSync(originalValue, {}, lang);
    if (translated && translated !== originalValue) {
      element.setAttribute(attr, translated);
    }
  }
}

/**
 * Walk and translate all text nodes + translatable attributes in a subtree
 */
function translateSubtree(root, lang) {
  if (!root) return;
  
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (SKIP_TAGS.has(node.tagName)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      }
    }
  );
  
  const textNodes = [];
  const elements = [];
  
  while (walker.nextNode()) {
    if (walker.currentNode.nodeType === Node.TEXT_NODE) {
      textNodes.push(walker.currentNode);
    } else if (walker.currentNode.nodeType === Node.ELEMENT_NODE) {
      elements.push(walker.currentNode);
    }
  }
  
  // Translate text nodes
  for (const node of textNodes) {
    translateTextNode(node, lang);
  }
  
  // Translate attributes
  for (const el of elements) {
    translateElementAttrs(el, lang);
  }
}

/**
 * AutoTranslate React Component
 * 
 * Wrap this around the application root to enable automatic universal translation.
 * Uses MutationObserver to watch for DOM changes and translates new content.
 * Listens for centralEngine's async translation updates and re-applies.
 */
export default function AutoTranslate({ children }) {
  const { language } = useLanguage();
  const containerRef = useRef(null);
  const observerRef = useRef(null);
  const langRef = useRef(language);
  const translateTimerRef = useRef(null);
  const retranslateTimerRef = useRef(null);
  
  // Keep langRef current
  langRef.current = language;
  
  /**
   * Run translation pass with requestAnimationFrame debounce
   */
  const scheduleTranslation = useCallback((target) => {
    if (translateTimerRef.current) {
      cancelAnimationFrame(translateTimerRef.current);
    }
    translateTimerRef.current = requestAnimationFrame(() => {
      const lang = langRef.current;
      translateSubtree(target || containerRef.current, lang);
    });
  }, []);
  
  // Full re-translation when language changes
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear all original text maps on language change to re-capture
    // (This ensures switching back from translated correctly re-captures originals)
    
    // Run translation immediately + a delayed pass for async React renders
    scheduleTranslation(containerRef.current);
    
    // Second pass after 200ms to catch late-rendered content
    const timer1 = setTimeout(() => {
      scheduleTranslation(containerRef.current);
    }, 200);
    
    // Third pass after 1s to catch async-loaded content
    const timer2 = setTimeout(() => {
      scheduleTranslation(containerRef.current);
    }, 1000);
    
    // Fourth pass after 3s to catch API-fetched translations
    const timer3 = setTimeout(() => {
      scheduleTranslation(containerRef.current);
    }, 3000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [language, scheduleTranslation]);
  
  // Set up MutationObserver to translate new content as it appears
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Initial translation pass
    scheduleTranslation(containerRef.current);
    
    let mutationBatchTimer = null;
    
    observerRef.current = new MutationObserver((mutations) => {
      const lang = langRef.current;
      if (lang === "en") return; // No translation needed for English
      
      // Batch mutation processing with debounce
      if (mutationBatchTimer) clearTimeout(mutationBatchTimer);
      mutationBatchTimer = setTimeout(() => {
        for (const mutation of mutations) {
          if (mutation.type === "childList") {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
                translateTextNode(node, lang);
              } else if (node.nodeType === Node.ELEMENT_NODE && !SKIP_TAGS.has(node.tagName)) {
                translateSubtree(node, lang);
              }
            }
          } else if (mutation.type === "characterData") {
            const node = mutation.target;
            if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
              const original = originalTextMap.get(node);
              const newText = node.textContent.trim();
              if (!original || (original !== newText && isTranslatableText(newText))) {
                originalTextMap.set(node, newText);
                translateTextNode(node, lang);
              }
            }
          }
        }
      }, 16); // ~1 frame debounce
    });
    
    observerRef.current.observe(containerRef.current, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    // Listen for centralEngine async translation completions
    const handleTranslationUpdated = (e) => {
      if (e.detail?.lang === langRef.current) {
        // Re-translate the entire tree with new cached translations
        if (retranslateTimerRef.current) clearTimeout(retranslateTimerRef.current);
        retranslateTimerRef.current = setTimeout(() => {
          scheduleTranslation(containerRef.current);
        }, 50);
      }
    };
    
    window.addEventListener("coophub_translation_updated", handleTranslationUpdated);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (translateTimerRef.current) {
        cancelAnimationFrame(translateTimerRef.current);
      }
      if (retranslateTimerRef.current) {
        clearTimeout(retranslateTimerRef.current);
      }
      if (mutationBatchTimer) clearTimeout(mutationBatchTimer);
      window.removeEventListener("coophub_translation_updated", handleTranslationUpdated);
    };
  }, [scheduleTranslation]);
  
  return (
    <div ref={containerRef} data-auto-translate="true" style={{ display: "contents" }}>
      {children}
    </div>
  );
}
