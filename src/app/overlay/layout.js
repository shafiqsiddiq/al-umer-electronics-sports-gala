export const metadata = {
  title: "Score Overlay",
};

export default function OverlayLayout({ children }) {
  return (
    <>
      <style>{`
        html, body {
          background: transparent !important;
          background-color: rgba(0,0,0,0) !important;
        }
        body > div, main {
          background: transparent !important;
        }
      `}</style>
      {children}
    </>
  );
}
