import React, { useRef, useState, useEffect, useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import FinishRide from '../components/FinishRide'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import LiveTracking from '../components/LiveTracking'
import logo from '../assets/cityride drivers.png'
import { SocketContext } from '../context/SocketContext'
import { CaptainDataContext } from '../context/CapatainContext'
import axios from 'axios'

const CaptainRiding = () => {

    const [finishRidePanel, setFinishRidePanel] = useState(false)
    const finishRidePanelRef = useRef(null)
    const location = useLocation()
    const rideData = location.state?.ride

    const [driverLocation, setDriverLocation] = useState(null)
    const [destinationCoords, setDestinationCoords] = useState(null)
    const [route, setRoute] = useState(null)
    const [liveDistance, setLiveDistance] = useState(null)

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

    useEffect(() => {
        if (rideData?.pickup && rideData?.destination) {
            axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-route`, {
                params: { origin: rideData.pickup, destination: rideData.destination },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            }).then(res => {
                setRoute(res.data)
            }).catch(err => {
                console.error("Error getting route:", err)
            })
        }
    }, [rideData])

    const { socket } = useContext(SocketContext)
    const { captain } = useContext(CaptainDataContext)

    useEffect(() => {
        const handleConnect = () => {
            if (captain && captain._id) {
                socket.emit("join", { userType: "captain", userId: captain._id })
            }
        }

        if (captain && captain._id) {
            socket.emit("join", { userType: "captain", userId: captain._id })
        }

        socket.on('connect', handleConnect)

        return () => {
            socket.off('connect', handleConnect)
        }
    }, [socket, captain])

    useEffect(() => {
        if (rideData?.destination) {
            axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-coordinates`, {
                params: { address: rideData.destination },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            }).then(res => {
                setDestinationCoords(res.data)
            }).catch(err => {
                console.error("Error getting destination coordinates:", err)
            })
        }
    }, [rideData])

    useEffect(() => {
        const updateLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        const loc = {
                            ltd: position.coords.latitude,
                            lng: position.coords.longitude
                        }
                        setDriverLocation(loc)
                        socket.emit('update-location-captain', {
                            userId: rideData?.captain?._id || rideData?.captain,
                            location: loc
                        })
                    },
                    error => {
                        console.warn("Captain geolocation failed during ride, using Patna fallback:", error);
                        const loc = {
                            ltd: 25.6003,
                            lng: 85.1872
                        }
                        setDriverLocation(loc)
                        socket.emit('update-location-captain', {
                            userId: rideData?.captain?._id || rideData?.captain,
                            location: loc
                        })
                    }
                )
            }
        }

        const locationInterval = setInterval(updateLocation, 10000)
        updateLocation()

        return () => clearInterval(locationInterval)
    }, [socket, rideData])

    useGSAP(function () {
        if (finishRidePanel) {
            gsap.to(finishRidePanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(finishRidePanelRef.current, {
                transform: 'translateY(120%)'
            })
        }
    }, [finishRidePanel])


    return (
        <div className='h-screen relative flex flex-col justify-end pointer-events-none'>

            <div className='h-screen fixed w-screen top-0 z-0 pointer-events-auto'>
                <LiveTracking driverLocation={driverLocation} destinationLocation={destinationCoords} route={route} />
            </div>

            <div className='fixed p-6 top-0 flex items-center justify-between w-screen z-10 pointer-events-auto'>
                <img className='w-16 pointer-events-none' src={logo} alt="" />
                <Link to='/captain-home' className=' h-10 w-10 bg-white flex items-center justify-center rounded-full'>
                    <i className="text-lg font-medium ri-logout-box-r-line"></i>
                </Link>
            </div>

            <div className='h-1/5 p-6 flex items-center justify-between relative bg-yellow-400 pt-10 z-10 pointer-events-auto'
                onClick={() => {
                    setFinishRidePanel(true)
                }}
            >
                <h5 className='p-1 text-center w-[90%] absolute top-0' onClick={() => {

                }}><i className="text-3xl text-gray-800 ri-arrow-up-wide-line"></i></h5>
                <h4 className='text-xl font-semibold'>
                    {liveDistance ? `${liveDistance} KM away` : rideData?.fare ? `${(rideData.fare / 10).toFixed(1)} KM away` : 'Calculating...'}
                </h4>
                <button className=' bg-green-600 text-white font-semibold p-3 px-10 rounded-lg'>Complete Ride</button>
            </div>

            <div ref={finishRidePanelRef} className='fixed w-full z-[500] bottom-0 translate-y-[120%] bg-white px-3 py-10 pt-12 pointer-events-auto'>
                <FinishRide
                    ride={rideData}
                    setFinishRidePanel={setFinishRidePanel} />
            </div>

        </div>
    )
}

export default CaptainRiding