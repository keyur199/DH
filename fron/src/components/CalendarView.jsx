import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

function CalendarView({ appointments }) {

    const events = appointments.map(a => ({
        title: a.name + " - " + a.service,
        start: new Date(a.date + " " + a.time),
        end: new Date(a.date + " " + a.time)
    }));

    return (

        <div style={{ height: "600px" }}>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
            />
        </div>

    )

}

export default CalendarView;