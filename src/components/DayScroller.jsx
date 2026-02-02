export default function DayScroller({ currentDay, onDayChange }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  
  return (
    <div className="day-scroller">
      {days.map(day => (
        <button
          key={day}
          className={`day-btn ${currentDay === day ? 'active' : ''}`}
          onClick={() => onDayChange(day)}
        >
          {day}
        </button>
      ))}
    </div>
  )
}