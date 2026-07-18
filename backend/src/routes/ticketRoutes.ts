import { Router } from 'express';
import { 
  createTicket, 
  getMyTickets, 
  getTicketDetails, 
  addTicketMessage, 
  getAdminTickets, 
  updateTicketStatus 
} from '../controllers/ticketController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Protected Customer/User routes
router.post('/', protect, createTicket);
router.get('/my-tickets', protect, getMyTickets);
router.get('/details/:ticketNumber', protect, getTicketDetails);
router.post('/details/:ticketNumber/messages', protect, addTicketMessage);

// Admin / Employee helpdesk routes
router.get('/admin-list', protect, restrictTo('admin', 'employee'), getAdminTickets);
router.put('/:id/status', protect, restrictTo('admin', 'employee'), updateTicketStatus);

export default router;
