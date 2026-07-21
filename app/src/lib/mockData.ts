import { backgroundImages } from './backgroundImages';

export interface Provider {
    id: string | number;
    name: string;
    service?: string; // For service providers
    type?: string;    // For businesses
    phone: string;
    rating: number;
    reviews: number;
    distance: string;
    location: string;
    hours?: string;
    description?: string;
    images?: string[];
    verified?: boolean;
    joined?: string;
    category?: string;
    services?: string[];
    user_type?: string;
    avatar_url?: string;
    latitude?: number;
    longitude?: number;
}

export const sampleServiceProviders: Provider[] = [
    { id: 1, name: 'John Kamau', service: 'Plumber', category: 'Plumber', phone: '0712345678', rating: 4.8, reviews: 124, distance: '0.5 km', location: 'Nairobi CBD', verified: true, joined: '2023', description: 'Expert plumber with over 10 years of experience in residential and commercial plumbing.', services: ['Leak Detection', 'Pipe Repair', 'Installation'], images: [backgroundImages[0], backgroundImages[1], backgroundImages[2]] },
    { id: 2, name: 'Mary Wanjiku', service: 'Electrician', category: 'Electrician', phone: '0723456789', rating: 4.9, reviews: 89, distance: '1.2 km', location: 'Westlands', verified: true, joined: '2022', description: 'Certified electrician specializing in home wiring and appliance installation.', services: ['Wiring', 'Lighting', 'Repairs'], images: [backgroundImages[3], backgroundImages[4], backgroundImages[5]] },
    { id: 3, name: 'Peter Ochieng', service: 'Carpenter', category: 'Carpenter', phone: '0734567890', rating: 4.7, reviews: 156, distance: '2.1 km', location: 'Kilimani', verified: false, joined: '2024', description: 'Custom furniture maker and woodworker.', services: ['Furniture Making', 'Cabinetry', 'Wood Carving'], images: [backgroundImages[6], backgroundImages[7], backgroundImages[8]] },
    { id: 4, name: 'Grace Muthoni', service: 'Hairdresser', category: 'Hairdresser', phone: '0745678901', rating: 4.9, reviews: 234, distance: '0.8 km', location: 'Ngara', verified: true, joined: '2023', description: 'Professional hair stylist and colorist.', services: ['Haircuts', 'Coloring', 'Styling'], images: [backgroundImages[0], backgroundImages[1], backgroundImages[2]] },
    { id: 5, name: 'James Mwangi', service: 'Mechanic', category: 'Mechanic', phone: '0756789012', rating: 4.6, reviews: 78, distance: '3.5 km', location: 'Industrial Area', verified: true, joined: '2021', description: 'Experienced auto mechanic for all car models.', services: ['Engine Repair', 'Brake Service', 'Oil Change'], images: [backgroundImages[3], backgroundImages[4], backgroundImages[5]] },
    { id: 6, name: 'Amina Hassan', service: 'Tailor', category: 'Tailor', phone: '0767890123', rating: 4.8, reviews: 145, distance: '1.5 km', location: 'Eastleigh', verified: true, joined: '2022', description: 'Custom tailoring and alterations for men and women.', services: ['Custom Suits', 'Alterations', 'Dressmaking'], images: [backgroundImages[6], backgroundImages[7], backgroundImages[8]] },
];

export const sampleBusinesses: Provider[] = [
    { id: 101, name: 'Nairobi Auto Spa', type: 'Car Wash', category: 'Car Wash', phone: '0711111111', rating: 4.7, reviews: 89, distance: '0.3 km', location: 'Nairobi CBD', hours: 'Open 24 hours', verified: true, joined: '2020', description: 'Premium car wash and detailing services.', services: ['Exterior Wash', 'Interior Detailing', 'Waxing'], images: [backgroundImages[0], backgroundImages[1], backgroundImages[2]] },
    { id: 102, name: 'Westlands Pharmacy', type: 'Pharmacy', category: 'Pharmacy', phone: '0722222222', rating: 4.9, reviews: 234, distance: '1.5 km', location: 'Westlands', hours: 'Open until 10 PM', verified: true, joined: '2019', description: 'Full-service pharmacy with prescription and over-the-counter medications.', services: ['Prescriptions', 'Consultations', 'Health Products'], images: [backgroundImages[3], backgroundImages[4], backgroundImages[5]] },
    { id: 103, name: 'Kilimani Supermarket', type: 'Supermarket', category: 'Supermarket', phone: '0733333333', rating: 4.5, reviews: 567, distance: '2.0 km', location: 'Kilimani', hours: 'Open until 9 PM', verified: true, joined: '2015', description: 'One-stop shop for groceries and household goods.', services: ['Groceries', 'Bakery', 'Butchery'], images: [backgroundImages[6], backgroundImages[7], backgroundImages[8]] },
    { id: 104, name: 'Java House Ngara', type: 'Restaurant', category: 'Restaurant', phone: '0744444444', rating: 4.6, reviews: 445, distance: '0.7 km', location: 'Ngara', hours: 'Open until 11 PM', verified: true, joined: '2018', description: 'Casual dining restaurant serving coffee and meals.', services: ['Breakfast', 'Lunch', 'Dinner', 'Coffee'], images: [backgroundImages[0], backgroundImages[1], backgroundImages[2]] },
    { id: 105, name: 'Eastleigh Hardware', type: 'Hardware Store', category: 'Hardware Store', phone: '0755555555', rating: 4.4, reviews: 123, distance: '2.5 km', location: 'Eastleigh', hours: 'Open until 7 PM', verified: false, joined: '2021', description: 'Hardware and construction materials supplier.', services: ['Construction Materials', 'Tools', 'Paints'], images: [backgroundImages[3], backgroundImages[4], backgroundImages[5]] },
    { id: 106, name: 'Industrial Garage', type: 'Garage', category: 'Garage', phone: '0766666666', rating: 4.8, reviews: 198, distance: '4.0 km', location: 'Industrial Area', hours: 'Open until 6 PM', verified: true, joined: '2017', description: 'Mechanic garage for repairs and maintenance.', services: ['Engine Repair', 'Body Work', 'Painting'], images: [backgroundImages[6], backgroundImages[7], backgroundImages[8]] },
];

// Helper to get all providers (static + local storage)
export const getAllProviders = (): { services: Provider[], businesses: Provider[] } => {
    const storedServices = JSON.parse(localStorage.getItem('registeredServices') || '[]');
    const storedBusinesses = JSON.parse(localStorage.getItem('registeredBusinesses') || '[]');

    return {
        services: [...storedServices, ...sampleServiceProviders],
        businesses: [...storedBusinesses, ...sampleBusinesses]
    };
};

export const getProviderById = (id: string | number): Provider | undefined => {
    const { services, businesses } = getAllProviders();
    const all = [...services, ...businesses];
    return all.find(p => String(p.id) === String(id));
};
