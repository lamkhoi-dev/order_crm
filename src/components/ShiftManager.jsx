import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import './ShiftManager.css';

const DENOMINATIONS = [500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000];

export default function ShiftManager({ onClose }) {
  const currentShift = useStore(s => s.currentShift);
  const openShift = useStore(s => s.openShift);
  const closeShift = useStore(s => s.closeShift);
  const addToast = useStore(s => s.addToast);

  // Mở ca state
  const [shiftName, setShiftName] = useState('Ca Sáng');
  const [startingCash, setStartingCash] = useState('');
  
  // Đóng ca state
  const [step, setStep] = useState(currentShift ? 'close' : 'open'); // open, close
  const [counts, setCounts] = useState(DENOMINATIONS.reduce((acc, d) => ({ ...acc, [d]: '' }), {}));
  const [totalCounted, setTotalCounted] = useState(0);

  useEffect(() => {
    let total = 0;
    Object.keys(counts).forEach(d => {
      total += Number(d) * (Number(counts[d]) || 0);
    });
    setTotalCounted(total);
  }, [counts]);

  const handleOpenShift = async () => {
    try {
      await openShift({
        name: shiftName,
        staffId: null, // Có thể update nếu có auth
        staffName: 'Quầy Thu Ngân',
        startingCash: Number(startingCash) || 0,
      });
      addToast(`Đã mở ${shiftName} thành công`, 'success');
      onClose();
    } catch (err) {
      // Error handled in store
    }
  };

  const handleCloseShift = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn đóng ca và in biên bản bàn giao?')) return;
    try {
      await closeShift(currentShift.id, {
        actualCash: totalCounted,
        handoverCash: totalCounted, // Mặc định bàn giao lại toàn bộ két
        denomination: counts,
      });
      addToast('Đóng ca thành công', 'success');
      onClose();
    } catch (err) {
      // Error handled in store
    }
  };

  const formatMoney = (amount) => new Intl.NumberFormat('vi-VN').format(amount || 0);

  if (step === 'open' && !currentShift) {
    return (
      <div className="shift-modal-overlay">
        <div className="shift-modal">
          <div className="shift-modal-header">
            <h3>Mở Ca Làm Việc</h3>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="shift-modal-body">
            <div className="form-group">
              <label>Tên ca (ví dụ: Ca Sáng, Ca Tối)</label>
              <select value={shiftName} onChange={e => setShiftName(e.target.value)} className="shift-input">
                <option value="Ca Sáng">Ca Sáng</option>
                <option value="Ca Chiều">Ca Chiều</option>
                <option value="Ca Tối">Ca Tối</option>
                <option value="Ca Khuya">Ca Khuya</option>
              </select>
            </div>
            <div className="form-group">
              <label>Tiền mặt đầu ca (có sẵn trong két)</label>
              <input 
                type="number" 
                className="shift-input amount-input"
                placeholder="Nhập số tiền..."
                value={startingCash}
                onChange={e => setStartingCash(e.target.value)}
              />
              {startingCash && <div className="amount-hint">{formatMoney(startingCash)} đ</div>}
            </div>
          </div>
          <div className="shift-modal-footer">
            <button className="btn-cancel" onClick={onClose}>Hủy</button>
            <button className="btn-primary" onClick={handleOpenShift}>Bắt Đầu Ca</button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'close' && currentShift) {
    return (
      <div className="shift-modal-overlay">
        <div className="shift-modal large">
          <div className="shift-modal-header">
            <h3>Kiểm Đếm & Bàn Giao Ca</h3>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="shift-modal-body split-grid">
            
            <div className="denomination-section">
              <h4 className="section-title">Nhập số lượng tờ tiền</h4>
              <div className="denomination-grid">
                {DENOMINATIONS.map(d => (
                  <div key={d} className="denom-row">
                    <span className="denom-label">{formatMoney(d)}đ</span>
                    <span className="denom-times">×</span>
                    <input 
                      type="number" 
                      min="0"
                      className="denom-input" 
                      value={counts[d]}
                      onChange={e => setCounts({ ...counts, [d]: e.target.value })}
                      placeholder="0"
                      onClick={e => e.target.select()}
                    />
                    <span className="denom-sum">{formatMoney(d * (counts[d] || 0))}đ</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="summary-section">
              <h4 className="section-title">Tổng Kết (Ước Tính)</h4>
              <div className="summary-list">
                <div className="summary-item">
                  <span>Tiền két đầu ca</span>
                  <strong>{formatMoney(currentShift.starting_cash)}đ</strong>
                </div>
                <div className="summary-item highlight-green">
                  <span>+ Thu trong ca (Tiền mặt)</span>
                  <strong>{formatMoney(currentShift.cash_income || 0)}đ</strong>
                </div>
                <div className="summary-item highlight-red">
                  <span>- Chi trong ca</span>
                  <strong>{formatMoney(currentShift.cash_expense || 0)}đ</strong>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-item indent">
                  <span>= Cần có trong két</span>
                  <strong className="text-blue">{formatMoney(currentShift.expected_cash || 0)}đ</strong>
                </div>
                
                <div className="summary-item mt-4">
                  <span>Tiền kiểm đếm thực tế</span>
                  <strong className="text-lg">{formatMoney(totalCounted)}đ</strong>
                </div>
                <div className={`summary-item ${totalCounted - (currentShift.expected_cash || 0) < 0 ? 'text-red' : totalCounted - (currentShift.expected_cash || 0) > 0 ? 'text-green' : ''}`}>
                  <span>Chênh lệch</span>
                  <strong>{formatMoney(totalCounted - (currentShift.expected_cash || 0))}đ</strong>
                </div>
              </div>
            </div>

          </div>
          <div className="shift-modal-footer">
            <button className="btn-cancel" onClick={onClose}>Hủy / Quay Lại</button>
            <button className="btn-primary" onClick={handleCloseShift}>
              Bàn Giao & Đóng Ca
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
