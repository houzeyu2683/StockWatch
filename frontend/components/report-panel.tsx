"use client";

import { Button } from "@/components/ui/button";
import { FileText, Download, Copy, Check } from "lucide-react";
import { useState } from "react";

interface ReportPanelProps {
  report: string | null;
  onGenerate: () => void;
  isDisabled: boolean;
  isLoading?: boolean;
}

export function ReportPanel({ report, onGenerate, isDisabled, isLoading }: ReportPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (report) {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (report) {
      const blob = new Blob([report], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stock-report-${new Date().toISOString().split("T")[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Report</h2>
        <div className="flex items-center gap-2">
          {report && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-2"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </>
          )}
          <Button
            onClick={onGenerate}
            disabled={isDisabled}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <FileText className="h-4 w-4" />
            {isLoading ? "生成中..." : "生成報告"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
        {report ? (
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm text-foreground/90 leading-relaxed">
            {report}
          </pre>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No report generated yet</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Click &quot;Generate Report&quot; to create a summary
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
