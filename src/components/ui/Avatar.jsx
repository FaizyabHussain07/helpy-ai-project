const Avatar = ({ name, size = 44, className = '', onClick }) => {
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getColorClass = (name) => {
    if (!name) return 'avatar-teal';
    const colors = ['avatar-orange', 'avatar-navy', 'avatar-coral', 'avatar-teal'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div 
      className={`avatar ${getColorClass(name)} ${className}`}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        fontSize: `${size * 0.32}px`,
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
