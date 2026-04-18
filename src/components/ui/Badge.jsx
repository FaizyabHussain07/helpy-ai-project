const Badge = ({ type, label, children }) => {
  const getBadgeClass = () => {
    switch (type) {
      case 'high':
      case 'urgency-high':
        return 'badge-high';
      case 'medium':
      case 'urgency-medium':
        return 'badge-medium';
      case 'low':
      case 'urgency-low':
        return 'badge-low';
      case 'open':
      case 'status-open':
        return 'badge-open';
      case 'solved':
      case 'status-solved':
        return 'badge-solved';
      case 'tag':
        return 'badge-tag';
      case 'teal':
        return 'badge-teal';
      default:
        return 'badge-tag';
    }
  };

  return (
    <span className={`badge ${getBadgeClass()}`}>
      {label || children}
    </span>
  );
};

export default Badge;
