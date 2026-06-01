import React, { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useEditorStyleStore } from '../../stores/editorStyleStore'

interface Props {
  children: React.ReactNode
}

/**
 * Wraps the editor in a Shadow DOM to isolate styles from Tailwind Preflight.
 * This prevents CSS reset conflicts with ProseMirror's default styles.
 */
export function EditorWrapper({ children }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null)
  const { getCssVariables, theme } = useEditorStyleStore()

  useEffect(() => {
    if (hostRef.current && !shadowRoot) {
      const root = hostRef.current.attachShadow({ mode: 'open' })
      setShadowRoot(root)
    }
  }, [shadowRoot])

  // Apply CSS variables to shadow root
  useEffect(() => {
    if (shadowRoot) {
      const vars = getCssVariables()
      const host = hostRef.current
      if (host) {
        Object.entries(vars).forEach(([key, value]) => {
          host.style.setProperty(key, value)
        })
        host.setAttribute('data-theme', theme)
      }
    }
  }, [shadowRoot, getCssVariables, theme])

  return (
    <div ref={hostRef} className="editor-shadow-host">
      {shadowRoot &&
        createPortal(
          <>
            <style>{`
              :host {
                display: block;
                font-family: var(--editor-font-family);
                font-size: var(--editor-font-size);
                line-height: var(--editor-line-height);
                color: var(--editor-text);
                background: var(--editor-bg);
              }

              .ProseMirror {
                outline: none;
                padding: var(--editor-padding-y) var(--editor-padding-x);
                max-width: var(--editor-max-width);
                margin: 0 auto;
                min-height: 100%;
              }

              .ProseMirror h1 { font-size: var(--editor-h1-size); font-weight: 700; margin: 1.5em 0 0.5em; }
              .ProseMirror h2 { font-size: var(--editor-h2-size); font-weight: 600; margin: 1.3em 0 0.4em; }
              .ProseMirror h3 { font-size: var(--editor-h3-size); font-weight: 600; margin: 1.2em 0 0.3em; }
              .ProseMirror p { margin: 0.8em 0; }
              .ProseMirror ul, .ProseMirror ol { padding-left: 1.5em; margin: 0.5em 0; }
              .ProseMirror li { margin: 0.2em 0; }
              .ProseMirror blockquote {
                border-left: 4px solid var(--editor-blockquote-border);
                margin: 1em 0;
                padding: 0.5em 1em;
                background: var(--editor-blockquote-bg);
                color: var(--editor-muted);
                font-style: italic;
              }
              .ProseMirror pre {
                background: var(--editor-code-bg);
                color: var(--editor-code-text);
                padding: 16px;
                border-radius: 8px;
                overflow-x: auto;
              }
              .ProseMirror code {
                background: var(--editor-code-bg);
                color: var(--editor-code-text);
                padding: 2px 6px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
              }
              .ProseMirror table { border-collapse: collapse; width: 100%; margin: 1em 0; }
              .ProseMirror th, .ProseMirror td { border: 1px solid var(--editor-border); padding: 8px 12px; }
              .ProseMirror th { background: var(--editor-accent-light); font-weight: 600; }
              .ProseMirror hr { border: none; border-top: 1px solid var(--editor-border); margin: 1.5em 0; }
              .ProseMirror img { max-width: 100%; height: auto; border-radius: 4px; }
              .ProseMirror a { color: var(--editor-accent); text-decoration: underline; }
              .ProseMirror mark { background: #fef08a; padding: 0 2px; }
              .ProseMirror ::selection { background: var(--editor-selection); }

              .ProseMirror p.is-editor-empty:first-child::before {
                content: attr(data-placeholder);
                float: left;
                color: var(--editor-muted);
                pointer-events: none;
                height: 0;
              }
            `}</style>
            {children}
          </>,
          shadowRoot
        )}
    </div>
  )
}
