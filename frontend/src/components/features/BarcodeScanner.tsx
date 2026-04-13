'use client';

/**
 * BarcodeScanner — uses the native BarcodeDetector Web API (no npm deps).
 * Supported: Chrome 83+, Edge 83+, Android Chrome, Samsung Internet.
 * Not supported: Safari/Firefox → shows a typed-entry fallback.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScanLine, CameraOff, RefreshCw, FlipHorizontal, Keyboard, Loader2 } from 'lucide-react';

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

interface BarcodeScannerProps {
    open: boolean;
    onScan: (result: string) => void;
    onClose: () => void;
}

export function BarcodeScanner({ open, onScan, onClose }: BarcodeScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<number | null>(null);
    const detectorRef = useRef<InstanceType<NonNullable<typeof window.BarcodeDetector>> | null>(null);
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
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }, []);

    // Check API support + list cameras when dialog opens
    useEffect(() => {
        if (!open) return;
        setError(null);
        setDetected(null);
        setManualInput('');

        const supported = typeof window !== 'undefined' && 'BarcodeDetector' in window;
        setApiSupported(supported);

        if (!supported) return;

        // Init detector with broad format support
        const formats = [
            'code_128', 'code_39', 'code_93',
            'ean_13', 'ean_8', 'upc_a', 'upc_e',
            'qr_code', 'data_matrix', 'pdf417',
        ];
        detectorRef.current = new window.BarcodeDetector!({ formats });

        navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                const videoDevices = devices.filter(d => d.kind === 'videoinput');
                setCameras(videoDevices);
                const back = videoDevices.find(d => /back|rear|environment/i.test(d.label));
                setSelectedCamera(back?.deviceId ?? videoDevices[0]?.deviceId);
            })
            .catch(() => setError('ไม่สามารถเข้าถึงกล้องได้'));
    }, [open]);

    // Start camera stream when camera is selected
    useEffect(() => {
        if (!open || !selectedCamera || !apiSupported) return;

        stopCamera();

        const constraints: MediaStreamConstraints = {
            video: {
                deviceId: { exact: selectedCamera },
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 },
            }
        };

        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
                startDetectionLoop();
            })
            .catch(err => {
                if (err.name === 'NotAllowedError') {
                    setError('ถูกปฏิเสธการใช้กล้อง กรุณาอนุญาตในการตั้งค่าเบราว์เซอร์');
                } else if (err.name === 'NotFoundError') {
                    setError('ไม่พบกล้องในอุปกรณ์นี้');
                } else {
                    setError('เกิดข้อผิดพลาดในการเปิดกล้อง');
                }
            });

        return () => stopCamera();
    }, [open, selectedCamera, apiSupported]);

    // Clean up when dialog closes
    useEffect(() => {
        if (!open) {
            stopCamera();
            setDetected(null);
            setError(null);
            setManualMode(false);
        }
    }, [open, stopCamera]);

    const startDetectionLoop = () => {
        const detect = async () => {
            if (!videoRef.current || !detectorRef.current) return;
            if (videoRef.current.readyState < 2) {
                rafRef.current = requestAnimationFrame(detect);
                return;
            }
            try {
                const results = await detectorRef.current.detect(videoRef.current);
                if (results.length > 0) {
                    const value = results[0].rawValue;
                    setDetected(value);
                    stopCamera();
                    setTimeout(() => {
                        onScanRef.current(value.toUpperCase());
                        onCloseRef.current();
                    }, 400);
                    return;
                }
            } catch {
                // Detection errors on individual frames are expected — keep looping
            }
            rafRef.current = requestAnimationFrame(detect);
        };
        rafRef.current = requestAnimationFrame(detect);
    };

    const switchCamera = () => {
        if (cameras.length < 2) return;
        const idx = cameras.findIndex(c => c.deviceId === selectedCamera);
        setSelectedCamera(cameras[(idx + 1) % cameras.length].deviceId);
    };

    const retryCamera = () => {
        setError(null);
        const id = selectedCamera;
        setSelectedCamera(undefined);
        setTimeout(() => setSelectedCamera(id), 100);
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
                        สแกนบาร์โค้ดเลขพัสดุ
                    </DialogTitle>
                </DialogHeader>

                {/* ── Unsupported browser fallback ── */}
                {apiSupported === false && !manualMode && (
                    <div className="px-4 pb-4 flex flex-col items-center gap-3 text-center">
                        <CameraOff className="h-10 w-10 text-gray-400 mt-2" />
                        <p className="text-sm text-gray-600">
                            เบราว์เซอร์นี้ไม่รองรับการสแกนบาร์โค้ด
                            <br />
                            <span className="text-xs text-gray-400">รองรับ: Chrome, Edge, Samsung Internet</span>
                        </p>
                        <Button size="sm" onClick={() => setManualMode(true)}>
                            <Keyboard className="h-3.5 w-3.5 mr-1.5" />
                            พิมพ์เลขพัสดุแทน
                        </Button>
                    </div>
                )}

                {/* ── Manual input fallback ── */}
                {manualMode && (
                    <div className="px-4 pb-4 flex flex-col gap-3">
                        <Input
                            autoFocus
                            placeholder="กรอกเลขพัสดุ"
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
