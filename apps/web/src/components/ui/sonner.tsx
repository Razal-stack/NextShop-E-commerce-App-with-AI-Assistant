"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <>
      <style jsx global>{`
        /* Toast Positioning - Below Header */
        [data-sonner-toaster][data-theme] {
          top: 72px !important;
          right: 12px !important;
          z-index: 9999 !important;
        }

        [data-sonner-toaster] {
          top: 72px !important;
          right: 12px !important;
          z-index: 9999 !important;
        }

        /* Toast Container Styling */
        [data-sonner-toaster] [data-sonner-toast] {
          background: white !important;
          border: 1px solid rgb(226, 232, 240) !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
          padding: 16px !important;
          max-width: 356px !important;
          font-family: inherit !important;
          margin-top: 0 !important;
          margin-right: 0 !important;
        }

        /* Toast Type Colors */
        [data-sonner-toaster] [data-sonner-toast][data-type="success"] {
          border-left: 4px solid #10b981 !important;
        }

        [data-sonner-toaster] [data-sonner-toast][data-type="error"] {
          border-left: 4px solid #ef4444 !important;
        }

        [data-sonner-toaster] [data-sonner-toast][data-type="warning"] {
          border-left: 4px solid #f59e0b !important;
        }

        [data-sonner-toaster] [data-sonner-toast][data-type="info"] {
          border-left: 4px solid #0439d7 !important;
        }

        /* Toast Content Styling */
        [data-sonner-toaster] [data-sonner-toast] [data-content] {
          color: rgb(51, 65, 85) !important;
          font-size: 14px !important;
          line-height: 1.4 !important;
        }

        [data-sonner-toaster] [data-sonner-toast] [data-title] {
          color: rgb(15, 23, 42) !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          margin-bottom: 4px !important;
        }

        /* Toast Animations */
        [data-sonner-toaster] [data-sonner-toast][data-mounted="true"] {
          animation: toast-slide-in 0.3s ease-out !important;
        }

        [data-sonner-toaster] [data-sonner-toast][data-removed="true"] {
          animation: toast-slide-out 0.2s ease-in !important;
        }

        @keyframes toast-slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes toast-slide-out {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
      <Sonner
        theme="light"
        className="toaster group"
        position="top-right"
        richColors
        toastOptions={{
          duration: 4000,
          className: 'custom-toast',
        }}
        style={
          {
            "--normal-bg": "var(--popover)",
            "--normal-text": "var(--popover-foreground)",
            "--normal-border": "var(--border)",
          } as React.CSSProperties
        }
        {...props}
      />
    </>
  );
};

export { Toaster };
