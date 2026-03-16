import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, CameraOff, QrCode, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useQRScanner } from "../qr-code/useQRScanner";

interface Props {
  open: boolean;
  onClose: () => void;
  userPrincipal?: string;
}

const CORNER_STYLES: Array<{ pos: string; border: string }> = [
  { pos: "top-0 left-0", border: "2px 0 0 2px" },
  { pos: "top-0 right-0", border: "2px 2px 0 0" },
  { pos: "bottom-0 left-0", border: "0 0 2px 2px" },
  { pos: "bottom-0 right-0", border: "0 2px 2px 0" },
];

export function QRModal({ open, onClose, userPrincipal }: Props) {
  const [activeTab, setActiveTab] = useState("scan");
  const {
    qrResults,
    isScanning,
    canStartScanning,
    startScanning,
    stopScanning,
    switchCamera,
    clearResults,
    videoRef,
    canvasRef,
    error,
    isSupported,
  } = useQRScanner({});

  const profileUrl = userPrincipal
    ? `${window.location.origin}/?user=${userPrincipal}`
    : window.location.origin;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(profileUrl)}&bgcolor=0d0d0d&color=f5f0e8&margin=8&format=png`;

  const lastResult = qrResults[qrResults.length - 1];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-ocid="qr.dialog"
        className="max-w-sm border-zinc-800 p-0 overflow-hidden"
        style={{ background: "oklch(0.12 0 0)", color: "oklch(0.97 0.01 85)" }}
      >
        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle
            className="text-lg font-semibold"
            style={{ color: "oklch(0.97 0.01 85)" }}
          >
            QR Code
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="px-6 pb-6 pt-3"
        >
          <TabsList
            className="w-full mb-4"
            style={{ background: "oklch(0.18 0 0)" }}
          >
            <TabsTrigger
              value="scan"
              data-ocid="qr.scan_tab"
              className="flex-1 text-sm"
            >
              <Camera className="w-3.5 h-3.5 mr-1.5" />
              Scan QR
            </TabsTrigger>
            <TabsTrigger
              value="myqr"
              data-ocid="qr.myqr_tab"
              className="flex-1 text-sm"
            >
              <QrCode className="w-3.5 h-3.5 mr-1.5" />
              My QR
            </TabsTrigger>
          </TabsList>

          {/* SCAN TAB */}
          <TabsContent value="scan" className="mt-0">
            <div className="flex flex-col gap-3">
              {!isSupported ? (
                <div
                  data-ocid="qr.error_state"
                  className="text-center py-8 text-sm"
                  style={{ color: "oklch(0.6 0 0)" }}
                >
                  QR scanning is not supported in this browser.
                </div>
              ) : (
                <>
                  {/* Camera preview */}
                  <div
                    className="relative w-full rounded-xl overflow-hidden"
                    style={{
                      background: "oklch(0.08 0 0)",
                      aspectRatio: "1",
                    }}
                  >
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                      style={{ display: isScanning ? "block" : "none" }}
                    />
                    <canvas
                      ref={canvasRef}
                      data-ocid="qr.canvas_target"
                      className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                    />
                    {!isScanning && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center"
                          style={{ background: "oklch(0.18 0 0)" }}
                        >
                          <Camera
                            className="w-7 h-7"
                            style={{ color: "oklch(0.5 0 0)" }}
                          />
                        </div>
                        <p
                          className="text-xs"
                          style={{ color: "oklch(0.5 0 0)" }}
                        >
                          Camera off
                        </p>
                      </div>
                    )}

                    {/* Scan overlay corners */}
                    {isScanning && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div
                          className="w-40 h-40 relative"
                          style={{
                            boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                            borderRadius: "4px",
                          }}
                        >
                          {CORNER_STYLES.map(({ pos, border }) => (
                            <div
                              key={pos}
                              className={`absolute ${pos} w-5 h-5`}
                              style={{
                                borderColor: "oklch(0.85 0.18 85)",
                                borderStyle: "solid",
                                borderWidth: border,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex gap-2">
                    {!isScanning ? (
                      <Button
                        data-ocid="qr.start_button"
                        className="flex-1 text-sm"
                        style={{
                          background: "oklch(0.75 0.16 85)",
                          color: "oklch(0.1 0 0)",
                        }}
                        onClick={startScanning}
                        disabled={!canStartScanning}
                      >
                        <Camera className="w-4 h-4 mr-1.5" />
                        Start Scan
                      </Button>
                    ) : (
                      <>
                        <Button
                          data-ocid="qr.stop_button"
                          variant="outline"
                          className="flex-1 text-sm border-zinc-700"
                          onClick={stopScanning}
                        >
                          <CameraOff className="w-4 h-4 mr-1.5" />
                          Stop
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-zinc-700"
                          onClick={switchCamera}
                          title="Switch camera"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Error */}
                  {error && (
                    <p
                      data-ocid="qr.error_state"
                      className="text-xs text-center"
                      style={{ color: "oklch(0.65 0.2 25)" }}
                    >
                      {error.message ?? String(error)}
                    </p>
                  )}

                  {/* Results */}
                  {lastResult && (
                    <div
                      className="rounded-lg p-3 flex flex-col gap-2"
                      style={{ background: "oklch(0.16 0 0)" }}
                    >
                      <div className="flex items-center justify-between">
                        <p
                          className="text-xs font-medium"
                          style={{ color: "oklch(0.7 0 0)" }}
                        >
                          Scanned result
                        </p>
                        <button
                          type="button"
                          onClick={clearResults}
                          className="text-xs"
                          style={{ color: "oklch(0.6 0 0)" }}
                        >
                          Clear
                        </button>
                      </div>
                      <p
                        className="text-sm break-all"
                        style={{ color: "oklch(0.92 0.18 85)" }}
                      >
                        {lastResult.data}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* MY QR TAB */}
          <TabsContent value="myqr" className="mt-0">
            <div className="flex flex-col items-center gap-4">
              <div
                className="rounded-2xl p-3 overflow-hidden"
                style={{ background: "oklch(0.08 0 0)" }}
              >
                <img
                  src={qrImageUrl}
                  alt="Your QR code"
                  width={220}
                  height={220}
                  className="rounded-xl"
                />
              </div>
              <div className="text-center">
                <p className="text-xs" style={{ color: "oklch(0.5 0 0)" }}>
                  Share this code to open your profile
                </p>
                <p
                  className="text-xs mt-1 break-all px-2"
                  style={{ color: "oklch(0.7 0.06 85)" }}
                >
                  {profileUrl}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
