import React, { useState, useEffect, useContext } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { SocketContext } from '../context/SocketContext'
import LiveTracking from '../components/LiveTracking'
import axios from 'axios'

const Riding = () => {
    const location = useLocation()
    const { ride } = location.state || {}
    const { socket } = useContext(SocketContext)
    const navigate = useNavigate()

    const [driverLocation, setDriverLocation] = useState(null)
    const [destinationCoords, setDestinationCoords] = useState(null)
    const [liveDistance, setLiveDistance] = useState(null)
    const [route, setRoute] = useState(null)

    useEffect(() => {
        if (ride?.pickup && ride?.destination) {
            axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-route`, {
                params: { origin: ride.pickup, destination: ride.destination },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            }).then(res => {
                setRoute(res.data)
            }).catch(err => {
                console.error("Error getting route:", err)
            })
        }
    }, [ride])

    // Helper to calculate Haversine distance
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c).toFixed(1);
    }

    useEffect(() => {
        // Fetch destination coordinates
        if (ride?.destination) {
            axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-coordinates`, {
                params: { address: ride.destination },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            }).then(res => {
                setDestinationCoords(res.data)
            }).catch(err => {
                console.error("Error getting destination coordinates:", err)
            })
        }
    }, [ride])

    useEffect(() => {
        socket.on("driver-location-updated", (data) => {
            setDriverLocation(data)
        })

        socket.on("ride-ended", () => {
            navigate('/home')
        })

        return () => {
            socket.off("driver-location-updated")
            socket.off("ride-ended")
        }
    }, [socket, navigate])

    useEffect(() => {
        if (driverLocation && destinationCoords) {
            const dist = calculateDistance(
                driverLocation.ltd || driverLocation.lat,
                driverLocation.lng,
                destinationCoords.ltd || destinationCoords.lat,
                destinationCoords.lng
            )
            setLiveDistance(dist)
        }
    }, [driverLocation, destinationCoords])

    return (
        <div className='h-screen'>
            <Link to='/home' className='fixed right-2 top-2 h-10 w-10 bg-white flex items-center justify-center rounded-full z-[1000]'>
                <i className="text-lg font-medium ri-home-5-line"></i>
            </Link>
            <div className='h-1/2'>
                <LiveTracking driverLocation={driverLocation} destinationLocation={destinationCoords} route={route} />
            </div>
            <div className='h-1/2 p-4'>
                <div className='flex items-center justify-between'>
                    <img className='h-12' src="https://swyft.pl/wp-content/uploads/2023/05/how-many-people-can-a-uberx-take.jpg" alt="" />
                    <div className='text-right'>
                        <h2 className='text-lg font-medium capitalize'>{ride?.captain.fullname.firstname}</h2>
                        <h4 className='text-xl font-semibold -mt-1 -mb-1'>{ride?.captain.vehicle.plate}</h4>
                        <p className='text-sm text-gray-600'>Maruti Suzuki Alto</p>
                    </div>
                </div>

                <div className='flex gap-2 justify-between flex-col items-center'>
                    <div className='w-full mt-5'>
                        <div className='flex items-center gap-5 p-3 border-b-2'>
                            <i className="text-lg ri-map-pin-2-fill"></i>
                            <div>
                                <h3 className='text-lg font-medium'>{liveDistance ? `${liveDistance} km away` : 'Calculating distance...'}</h3>
                                <p className='text-sm -mt-1 text-gray-600'>{ride?.destination}</p>
                            </div>
                        </div>
                        <div className='flex items-center gap-5 p-3'>
                            <i className="ri-currency-line"></i>
                            <div>
                                <h3 className='text-lg font-medium'>₹{ride?.fare} </h3>
                                <p className='text-sm -mt-1 text-gray-600'>Cash Cash</p>
                            </div>
                        </div>
                    </div>
                </div>
                <button className='w-full mt-5 bg-green-600 text-white font-semibold p-2 rounded-lg'>Make a Payment</button>
            </div>
        </div>
    )
}

export default Riding