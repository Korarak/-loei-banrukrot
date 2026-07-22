'use client';

/**
 * BarcodeScanner — prefers the native BarcodeDetector Web API (Chrome/Edge/
 * Android Chrome/Samsung Internet), which decodes off-thread via the OS.
 * Every iOS browser (Chrome, Firefox, Safari — all required by Apple to run
 * on WebKit) lacks that API entirely, so on iOS — and any other browser
 * without it — this falls back to @zxing/browser's pure-JS decoder, which
 * only needs getUserMedia + <canvas>, so it works anywhere a camera does.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScanLine, CameraOff, RefreshCw, FlipHorizontal, Keyboard, Loader2 } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

// Extend Window type for BarcodeDetector (not yet in lib.dom.d.ts)
declare global {
    interface Window {
        BarcodeDetector?: {
            new(options?: { formats: string[] }): {
                detect(source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap): Promise<Array<{ rawValue: string }>>;
            };
            getSupportedFormats?(): Promise<string[]>;
        };
    }
}

const ZXING_HINTS = new Map([
    [DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.CODE_93,
        BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
        BarcodeFormat.QR_CODE, BarcodeFormat.DATA_MATRIX, BarcodeFormat.PDF_417,
    ]],
]);

interface BarcodeScannerProps {
    open: boolean;
    onScan: (result: string) => void;
    onClose: () => void;
    title?: string;
    manualPlaceholder?: string;
    manualButtonLabel?: string;
}

export function BarcodeScanner({
    open,
    onScan,
    onClose,
    title = 'สแกนบาร์โค้ดเลขพัสดุ',
    manualPlaceholder = 'กรอกเลขพัสดุ',
    manualButtonLabel = 'พิมพ์เลขพัสดุแทน',
}: BarcodeScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<number | null>(null);
    const detectorRef = useRef<InstanceType<NonNullable<typeof window.BarcodeDetector>> | null>(null);
    // Only set when the native BarcodeDetector is unavailable (every iOS browser) —
    // holds the ZXing reader/controls used for the software-decode fallback instead.
    const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
    const zxingControlsRef = useRef<IScannerControls | null>(null);
    const onScanRef = useRef(onScan);
    const onCloseRef = useRef(onClose);
    useEffect(() => { onScanRef.current = onScan; }, [onScan]);
    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [selectedCamera, setSelectedCamera] = useState<string | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);
    const [apiSupported, setApiSupported] = useState<boolean | null>(null);
    const [detected, setDetected] = useState<string | null>(null);
    const [manualMode, setManualMode] = useState(false);
    const [manualInput, setManualInput] = useState('');

    const stopCamera = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        zxingControlsRef.current?.stop();
        zxingControlsRef.current = null;
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }, []);

    // Fires on a successful decode from either engine — shared so both paths
    // behave identically (flash the value, stop the camera, hand it off).
    const handleDetected = useCallback((value: string) => {
        setDetected(value);
        stopCamera();
        setTimeout(() => {
            onScanRef.current(value.toUpperCase());
            onCloseRef.current();
        }, 400);
    }, [stopCamera]);

    const startDetectionLoop = useCallback(() => {
        const detect = async () => {
            if (!videoRef.current || !detectorRef.current) return;
            if (videoRef.current.readyState < 2) {
                rafRef.current = requestAnimationFrame(detect);
                return;
            }
            try {
                const results = await detectorRef.current.detect(videoRef.current);
                if (results.length > 0) {
                    handleDetected(results[0].rawValue);
                    return;
                }
            } catch {
                // Detection errors on individual frames are expected — keep looping
            }
            rafRef.current = requestAnimationFrame(detect);
        };
        rafRef.current = requestAnimationFrame(detect);
    }, [handleDetected]);

    // Software-decode fallback for browsers with no native BarcodeDetector —
    // every iOS browser, since Apple requires them all to run on WebKit.
    // ZXing decodes frames read off the existing <video> via <canvas>, so it
    // needs nothing beyond the getUserMedia stream we already opened.
    const startZxingLoop = useCallback((stream: MediaStream) => {
        if (!videoRef.current || !zxingReaderRef.current) return;
        zxingReaderRef.current
            .decodeFromStream(stream, videoRef.current, (result, err, controls) => {
                zxingControlsRef.current = controls;
                if (result) handleDetected(result.getText());
            })
            .catch(() => {
                setError('เกิดข้อผิดพลาดในการเปิดกล้อง');
            });
    }, [handleDetected]);

    // Opens the camera. Deliberately does NOT require a deviceId up front —
    // enumerateDevices() returns blank labels/deviceIds until permission has
    // been granted at least once, so gating the first getUserMedia call on
    // "pick a device from the list" meant the permission prompt never fired
    // on a fresh origin (selectedCamera stayed '' / undefined forever).
    // Instead: request a generic environment-facing stream first (which is
    // what actually triggers the browser's permission prompt), then use the
    // now-populated device list to support explicit camera switching.
    const openStream = useCallback((deviceId?: string) => {
        stopCamera();
        setError(null);

        const constraints: MediaStreamConstraints = {
            video: deviceId
                ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
                : { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        };

        navigator.mediaDevices.getUserMedia(constraints)
            .then(async (stream) => {
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
                try {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const videoDevices = devices.filter(d => d.kind === 'videoinput');
                    setCameras(videoDevices);
                    const activeId = stream.getVideoTracks()[0]?.getSettings().deviceId;
                    setSelectedCamera(activeId ?? deviceId ?? videoDevices[0]?.deviceId);
                } catch {
                    // Device listing is best-effort — scanning still works without a switcher
                }
                if (detectorRef.current) {
                    startDetectionLoop();
                } else {
                    startZxingLoop(stream);
                }
            })
            .catch(err => {
                if (err.name === 'NotAllowedError') {
                    setError('ถูกปฏิเสธการใช้กล้อง กรุณาอนุญาตในการตั้งค่าเบราว์เซอร์');
                } else if (err.name === 'NotFoundError') {
                    setError('ไม่พบกล้องในอุปกรณ์นี้');
                } else if (err.name === 'OverconstrainedError') {
                    setError('ไม่พบกล้องที่เลือก กรุณาลองสลับกล้อง');
                } else {
                    setError('เกิดข้อผิดพลาดในการเปิดกล้อง');
                }
            });
    }, [stopCamera, startDetectionLoop, startZxingLoop]);

    // Check API support when dialog opens
    useEffect(() => {
        if (!open) return;
        setError(null);
        setDetected(null);
        setManualInput('');

        // getUserMedia only exists in secure contexts (HTTPS, or localhost) —
        // on plain HTTP over a LAN IP the API is silently absent, which used
        // to look identical to "unsupported browser" with no clear message.
        if (typeof window !== 'undefined' && window.isSecureContext === false) {
            setApiSupported(false);
            setError('ต้องเข้าผ่าน HTTPS (หรือ localhost) เพื่อใช้กล้อง');
            return;
        }

        // Camera access (getUserMedia) is the only hard requirement — the actual
        // decoding falls back to ZXing when the native BarcodeDetector isn't there.
        const cameraSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
        setApiSupported(cameraSupported);

        if (!cameraSupported) return;

        const hasNativeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;
        if (hasNativeDetector) {
            const formats = [
                'code_128', 'code_39', 'code_93',
                'ean_13', 'ean_8', 'upc_a', 'upc_e',
                'qr_code', 'data_matrix', 'pdf417',
            ];
            detectorRef.current = new window.BarcodeDetector!({ formats });
            zxingReaderRef.current = null;
        } else {
            detectorRef.current = null;
            zxingReaderRef.current = new BrowserMultiFormatReader(ZXING_HINTS);
        }
    }, [open]);

    // Start the camera once support is confirmed
    useEffect(() => {
        if (!open || apiSupported !== true) return;
        openStream();
        return () => stopCamera();
    }, [open, apiSupported, openStream, stopCamera]);

    // Clean up when dialog closes
    useEffect(() => {
        if (!open) {
            stopCamera();
            setDetected(null);
            setError(null);
            setManualMode(false);
        }
    }, [open, stopCamera]);

    const switchCamera = () => {
        if (cameras.length < 2) return;
        const idx = cameras.findIndex(c => c.deviceId === selectedCamera);
        const next = cameras[(idx + 1) % cameras.length];
        setSelectedCamera(next.deviceId);
        openStream(next.deviceId);
    };

    const retryCamera = () => {
        openStream(selectedCamera);
    };

    const submitManual = () => {
        const v = manualInput.trim().toUpperCase();
        if (!v) return;
        onScan(v);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
                <DialogHeader className="px-4 pt-4 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <ScanLine className="h-4 w-4 text-primary" />
                        {title}
                    </DialogTitle>
                </DialogHeader>

                {/* ── Unsupported browser fallback ── */}
                {apiSupported === false && !manualMode && (
                    <div className="px-4 pb-4 flex flex-col items-center gap-3 text-center">
                        <CameraOff className="h-10 w-10 text-gray-400 mt-2" />
                        {error ? (
                            <p className="text-sm text-gray-600">{error}</p>
                        ) : (
                            <p className="text-sm text-gray-600">
                                อุปกรณ์นี้ไม่มีกล้องหรือไม่รองรับการเข้าถึงกล้อง
                            </p>
                        )}
                        <Button size="sm" onClick={() => setManualMode(true)}>
                            <Keyboard className="h-3.5 w-3.5 mr-1.5" />
                            {manualButtonLabel}
                        </Button>
                    </div>
                )}

                {/* ── Manual input fallback ── */}
                {manualMode && (
                    <div className="px-4 pb-4 flex flex-col gap-3">
                        <Input
                            autoFocus
                            placeholder={manualPlaceholder}
                            value={manualInput}
                            onChange={e => setManualInput(e.target.value.toUpperCase())}
                            onKeyDown={e => e.key === 'Enter' && submitManual()}
                            className="h-11 font-mono tracking-wider"
                        />
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setManualMode(false)}>ย้อนกลับ</Button>
                            <Button className="flex-1" onClick={submitManual} disabled={!manualInput.trim()}>ยืนยัน</Button>
                        </div>
                    </div>
                )}

                {/* ── Checking API support ── */}
                {apiSupported === null && !manualMode && (
                    <div className="px-4 pb-4 flex flex-col items-center gap-2 py-6 text-gray-400">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <p className="text-xs">กำลังตรวจสอบกล้อง…</p>
                    </div>
                )}

                {/* ── Camera viewport ── */}
                {apiSupported === true && !manualMode && (
                    <>
                        <div className="relative bg-black w-full aspect-[4/3] overflow-hidden">
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                            />

                            {/* Scan frame overlay */}
                            {!error && !detected && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    {/* Dimmed surround */}
                                    <div className="absolute inset-0 bg-black/40"
                                        style={{ maskImage: 'radial-gradient(ellipse 68% 50% at 50% 50%, transparent 55%, black 100%)' }}
                                    />
                                    {/* Corner guides */}
                                    <div className="relative w-64 h-40 z-10">
                                        <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl" />
                                        <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr" />
                                        <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl" />
                                        <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br" />
                                        {/* Scan line */}
                                        <span className="absolute left-2 right-2 h-0.5 bg-primary/90 shadow-[0_0_6px_2px] shadow-primary/50 animate-scan-line" />
                                    </div>
                                </div>
                            )}

                            {/* Success flash */}
                            {detected && (
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                    <div className="bg-white rounded-lg px-4 py-2 shadow-lg text-sm font-mono font-bold text-primary">
                                        {detected}
                                    </div>
                                </div>
                            )}

                            {/* Error overlay */}
                            {error && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 text-white p-6">
                                    <CameraOff className="h-10 w-10 opacity-60" />
                                    <p className="text-sm text-center opacity-80">{error}</p>
                                </div>
                            )}

                            {/* Camera switcher */}
                            {cameras.length > 1 && !error && (
                                <button
                                    type="button"
                                    onClick={switchCamera}
                                    aria-label="สลับกล้อง"
                                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                                >
                                    <FlipHorizontal className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <div className="px-4 py-3 flex items-center justify-between gap-3">
                            <p className="text-xs text-gray-500 leading-snug">
                                {error ? 'ไม่สามารถใช้งานกล้องได้' : 'วางบาร์โค้ดให้อยู่ในกรอบ'}
                            </p>
                            <div className="flex gap-2 shrink-0">
                                {error && (
                                    <Button size="sm" variant="outline" onClick={retryCamera}>
                                        <RefreshCw className="h-3.5 w-3.5 mr-1" />ลองใหม่
                                    </Button>
                                )}
                                <Button size="sm" variant="ghost" onClick={() => setManualMode(true)}>
                                    <Keyboard className="h-3.5 w-3.5 mr-1" />พิมพ์
                                </Button>
                                <Button size="sm" variant="outline" onClick={onClose}>ปิด</Button>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
