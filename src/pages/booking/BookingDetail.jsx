import { useParams } from 'react-router-dom';

export default function BookingDetail() {
    const { id } = useParams();
    return (
        <div className="page-container py-8">
            <h1 className="text-3xl font-display font-bold text-gray-900">Booking Detail</h1>
            <p className="text-gray-500 mt-2">Booking ID: {id}</p>
            {/* Booking detail will be implemented here */}
        </div>
    );
}
