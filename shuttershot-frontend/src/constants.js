// Kept in sync with AdminUserService.MAIN_ADMIN_EMAIL on the backend, which
// is what actually enforces the main-admin-only rules — these frontend
// checks just keep the UI from offering actions the backend will reject.
export const MAIN_ADMIN_EMAIL = 'admin@shuttershot.com'

// All 64 districts of Bangladesh, grouped by division — kept in sync with
// BangladeshDistricts.java on the backend, which is what actually validates
// a photographer's location at registration.
export const BANGLADESH_DISTRICTS = [
  // Dhaka division
  'Dhaka', 'Faridpur', 'Gazipur', 'Gopalganj', 'Kishoreganj', 'Madaripur',
  'Manikganj', 'Munshiganj', 'Narayanganj', 'Narsingdi', 'Rajbari', 'Shariatpur', 'Tangail',
  // Chattogram division
  'Bandarban', 'Brahmanbaria', 'Chandpur', 'Chattogram', 'Cumilla', "Cox's Bazar",
  'Feni', 'Khagrachhari', 'Lakshmipur', 'Noakhali', 'Rangamati',
  // Rajshahi division
  'Bogura', 'Chapainawabganj', 'Joypurhat', 'Naogaon', 'Natore', 'Pabna', 'Rajshahi', 'Sirajganj',
  // Khulna division
  'Bagerhat', 'Chuadanga', 'Jashore', 'Jhenaidah', 'Khulna', 'Kushtia',
  'Magura', 'Meherpur', 'Narail', 'Satkhira',
  // Barishal division
  'Barguna', 'Barishal', 'Bhola', 'Jhalokati', 'Patuakhali', 'Pirojpur',
  // Sylhet division
  'Habiganj', 'Moulvibazar', 'Sunamganj', 'Sylhet',
  // Rangpur division
  'Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Rangpur', 'Thakurgaon',
  // Mymensingh division
  'Jamalpur', 'Mymensingh', 'Netrokona', 'Sherpur',
]
