import { ChevronRight } from 'lucide-react';

const RequestCard = ({ request, onClick }) => {
  const getUrgencyBadge = (urgency) => {
    const classes = {
      'High': 'badge-high',
      'Medium': 'badge-medium',
      'Low': 'badge-low'
    };
    return classes[urgency] || 'badge-low';
  };

  const getStatusBadge = (status) => {
    return status === 'solved' ? 'badge-solved' : 'badge-open';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="request-card" onClick={onClick}>
      <div className="request-card-badges">
        <span className={`badge ${getUrgencyBadge(request.urgency)}`}>
          {request.urgency}
        </span>
        <span className={`badge ${getStatusBadge(request.status)}`}>
          {request.status === 'solved' ? 'Solved' : 'Open'}
        </span>
        <span className="badge badge-tag">{request.category}</span>
      </div>

      <h3 className="request-card-title">{request.title}</h3>
      
      <p className="request-card-desc">
        {request.description}
      </p>

      {request.tags && request.tags.length > 0 && (
        <div className="request-card-tags">
          {request.tags.slice(0, 4).map((tag, idx) => (
            <span key={idx} className="badge badge-tag" style={{ fontSize: '11px', padding: '4px 10px' }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="request-card-footer">
        <span className="request-card-author">
          {request.authorName} • {request.authorLocation || 'Remote'}
          {request.helperCount > 0 && ` • ${request.helperCount} helper${request.helperCount > 1 ? 's' : ''} interested`}
        </span>
        <span className="request-card-action">
          Open details <ChevronRight size={14} />
        </span>
      </div>
    </div>
  );
};

export default RequestCard;
