import React from 'react';
import QRCode from 'react-qr-code';
import '../styles/QRCodeDisplay.css';

/**
 * QRCodeDisplay component
 * 
 * Displays a QR code containing workbook text and calculation total
 * 
 * @param {Object} props Component props
 * @param {boolean} props.isVisible Whether the QR code is visible
 * @param {string} props.content The content to encode in the QR code
 * @param {function} props.onClose Function to close the QR code display
 */
const QRCodeDisplay = ({ isVisible, content, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="qrcode-container">
      <div className="qrcode-modal">
        <div className="qrcode-header">
          <h3>Scan QR Code</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="qrcode-content">
          <QRCode 
            value={content} 
            size={256}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            viewBox={`0 0 256 256`}
          />
        </div>
        <div className="qrcode-footer">
          <p>Scan with your mobile device to view this calculation</p>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
