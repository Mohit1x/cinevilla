"use client";

import { useEffect, useRef } from "react";

export default function AdsterraBanner() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const container = ref.current;
    const html = `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;overflow:hidden}</style></head><body>
<script>atOptions={'key':'15127a25ba1e2e69a6489bcae8db1cdc','format':'iframe','height':60,'width':468,'params':{}}<\/script>
<script src="https://bancadeltempoidea.org/22/15127a25ba1e2e69a6489bcae8db1cdc"><\/script>
</body></html>`
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.width = "468";
    iframe.height = "60";
    iframe.style.border = "none";
    iframe.scrolling = "no";
    container.appendChild(iframe);
    return () => {
      URL.revokeObjectURL(url);
      if (container.contains(iframe)) container.removeChild(iframe);
    };
  }, []);

  return (
    <div className="flex justify-center items-center py-4 bg-black/20">
      <div ref={ref} style={{ width: 468, height: 60 }} />
    </div>
  );
}
