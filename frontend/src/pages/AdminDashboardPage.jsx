import { useEffect, useState } from "react";
import client from "../api/client";
import useSocket from "../hooks/useSocket";

export default function AdminDashboardPage() {
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [newRoute, setNewRoute] = useState({ name: "", code: "", stops: [] });
  const [newBus, setNewBus] = useState({ number: "", route: "" });
  const [editingRouteId, setEditingRouteId] = useState(null);
  const [editingBusId, setEditingBusId] = useState(null);
  const [routeDraft, setRouteDraft] = useState({
    name: "",
    code: "",
    stops: [],
  });
  const [busDraft, setBusDraft] = useState({
    number: "",
    route: "",
    status: "stopped",
    isTripActive: false,
  });
  const [newStop, setNewStop] = useState({
    name: "",
    latitude: "",
    longitude: "",
  });
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "driver",
  });
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const { socket, busLocations, isConnected } = useSocket();

  const load = async () => {
    try {
      const [routesRes, busesRes, driversRes] = await Promise.all([
        client.get("/routes"),
        client.get("/buses"),
        client.get("/users/drivers"),
      ]);
      setRoutes(routesRes.data);
      setBuses(busesRes.data);
      setDrivers(driversRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: "", message: "" }), 4000);
  };

  const createRoute = async (e) => {
    e.preventDefault();
    try {
      await client.post("/routes", newRoute);
      setNewRoute({ name: "", code: "", stops: [] });
      await load();
      showFeedback("success", "Route created successfully");
    } catch (err) {
      showFeedback(
        "error",
        err.response?.data?.message || "Failed to create route",
      );
    }
  };

  const addStopToNewRoute = () => {
    if (!newStop.name || !newStop.latitude || !newStop.longitude) return;
    setNewRoute({
      ...newRoute,
      stops: [
        ...newRoute.stops,
        {
          name: newStop.name,
          latitude: Number(newStop.latitude),
          longitude: Number(newStop.longitude),
        },
      ],
    });
    setNewStop({ name: "", latitude: "", longitude: "" });
  };

  const removeStopFromNewRoute = (index) => {
    setNewRoute({
      ...newRoute,
      stops: newRoute.stops.filter((_, i) => i !== index),
    });
  };

  const createBus = async (e) => {
    e.preventDefault();
    try {
      await client.post("/buses", newBus);
      setNewBus({ number: "", route: "" });
      await load();
      showFeedback("success", "Bus created successfully");
    } catch (err) {
      showFeedback(
        "error",
        err.response?.data?.message || "Failed to create bus",
      );
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      await client.post("/users", newUser);
      setNewUser({ name: "", email: "", password: "", role: "driver" });
      await load();
      showFeedback("success", "User created successfully");
    } catch (err) {
      showFeedback(
        "error",
        err.response?.data?.message || "Failed to create user",
      );
    }
  };

  const assign = async (busId, driverId) => {
    try {
      await client.post("/buses/assign-driver", { busId, driverId });
      await load();
      showFeedback("success", "Driver assigned");
    } catch (err) {
      showFeedback("error", err.response?.data?.message || "Assignment failed");
    }
  };

  const deleteRoute = async (id) => {
    if (!window.confirm("Delete this route?")) return;
    try {
      await client.delete(`/routes/${id}`);
      await load();
      showFeedback("success", "Route deleted");
    } catch (err) {
      showFeedback("error", "Delete failed");
    }
  };

  const deleteBus = async (id) => {
    if (!window.confirm("Delete this bus?")) return;
    try {
      await client.delete(`/buses/${id}`);
      await load();
      showFeedback("success", "Bus deleted");
    } catch (err) {
      showFeedback("error", "Delete failed");
    }
  };

  return (
    <main className="mx-auto max-w-7xl p-6 lg:p-10 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Admin Dashboard
          </h2>
          <p className="text-slate-500 font-medium">
            Manage your fleet, routes, and personnel from one place.
          </p>
        </div>
        <div
          className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ${isConnected ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
        >
          <span
            className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}
          ></span>
          {isConnected ? "Real-time Connected" : "Syncing..."}
        </div>
      </div>

      {feedback.message && (
        <div
          className={`animate-slide-up rounded-2xl p-4 text-sm font-bold border ${feedback.type === "error" ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}
        >
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Forms */}
        <div className="space-y-8">
          <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Add</h3>
            <form onSubmit={createRoute} className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                New Route
              </p>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Route Name"
                value={newRoute.name}
                onChange={(e) =>
                  setNewRoute({ ...newRoute, name: e.target.value })
                }
              />
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Route Code"
                value={newRoute.code}
                onChange={(e) =>
                  setNewRoute({ ...newRoute, code: e.target.value })
                }
              />

              <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Add Stops
                </p>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Stop Name"
                  value={newStop.name}
                  onChange={(e) => setNewStop({ ...newStop, name: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Latitude"
                    type="number"
                    step="any"
                    value={newStop.latitude}
                    onChange={(e) => setNewStop({ ...newStop, latitude: e.target.value })}
                  />
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Longitude"
                    type="number"
                    step="any"
                    value={newStop.longitude}
                    onChange={(e) => setNewStop({ ...newStop, longitude: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  onClick={addStopToNewRoute}
                  className="w-full rounded-xl border-2 border-dashed border-slate-200 py-2 text-xs font-bold text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                >
                  + Add Stop to List
                </button>
              </div>

              {newRoute.stops.length > 0 && (
                <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2">
                  {newRoute.stops.map((stop, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div>
                        <p className="text-xs font-bold text-slate-700">{stop.name}</p>
                        <p className="text-[9px] text-slate-400">{stop.latitude}, {stop.longitude}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeStopFromNewRoute(i)}
                        className="text-slate-300 hover:text-red-500"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-700 mt-4">
                Create Route with {newRoute.stops.length} Stops
              </button>
            </form>
            <div className="my-6 border-t border-slate-100"></div>
            <form onSubmit={createBus} className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                New Vehicle
              </p>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Bus Number"
                value={newBus.number}
                onChange={(e) =>
                  setNewBus({ ...newBus, number: e.target.value })
                }
              />
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={newBus.route}
                onChange={(e) =>
                  setNewBus({ ...newBus, route: e.target.value })
                }
              >
                <option value="">Select Route</option>
                {routes.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <button className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800">
                Assign & Create
              </button>
            </form>

            <div className="my-6 border-t border-slate-100"></div>

            <form onSubmit={createUser} className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                New Personnel
              </p>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Full Name"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                required
              />
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Email Address"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                required
              />
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Password"
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                required
              />
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
              >
                <option value="driver">Driver</option>
                <option value="admin">Admin</option>
                <option value="student">Student</option>
              </select>
              <button className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-700">
                Create User
              </button>
            </form>
          </section>
        </div>

        {/* Right Columns: Tables/Lists */}
        <div className="lg:col-span-2 space-y-8">
          <section className="rounded-3xl bg-white shadow-sm border border-slate-100 overflow-hidden">
            <div className="border-b border-slate-50 bg-slate-50/50 p-6 px-8 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Active Fleet</h3>
              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
                {buses.length} Vehicles
              </span>
            </div>
            <div className="divide-y divide-slate-50">
              {buses.map((bus) => (
                <div
                  key={bus._id}
                  className="p-6 px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/30 transition-all"
                >
                  <div>
                    <p className="text-lg font-bold text-slate-900">
                      Bus {bus.number}
                    </p>
                    <p className="text-sm font-medium text-slate-500">
                      {bus.route?.name || "Unassigned Route"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Driver
                      </p>
                      <select
                        className="rounded-lg border border-slate-200 bg-transparent py-1 px-2 text-xs font-bold text-slate-600 outline-none focus:border-indigo-500"
                        defaultValue={bus.driver?._id || ""}
                        onChange={(e) => assign(bus._id, e.target.value)}
                      >
                        <option value="">No Driver</option>
                        {drivers.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => deleteBus(bus._id)}
                      className="rounded-full p-2 text-slate-300 hover:text-red-500 transition-all"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              {buses.length === 0 && (
                <div className="p-10 text-center text-slate-400 italic">
                  No buses registered yet.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl bg-white shadow-sm border border-slate-100 overflow-hidden">
            <div className="border-b border-slate-50 bg-slate-50/50 p-6 px-8 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">
                Configured Routes
              </h3>
              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
                {routes.length} Active
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y divide-x divide-slate-50">
              {routes.map((route) => (
                <div
                  key={route._id}
                  className="p-6 px-8 hover:bg-slate-50/30 transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-base font-bold text-slate-900">
                      {route.name}
                    </p>
                    <button
                      onClick={() => deleteRoute(route._id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs font-bold text-indigo-600 bg-indigo-50 inline-block px-2 py-0.5 rounded-full mb-3">
                    {route.code}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4l3 3" />
                    </svg>
                    {route.stops?.length || 0} Scheduled Stops
                  </div>
                </div>
              ))}
              {routes.length === 0 && (
                <div className="col-span-2 p-10 text-center text-slate-400 italic">
                  No routes configured yet.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
