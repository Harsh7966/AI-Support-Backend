import Ticket from "../../Schema/customers/ticketSchema.js";

const getAllTicket= async(req, res)=>{
    try{
        const getAllTickets= await Ticket.find({})
        .populate("customerId", "firstName lastName email role phone isActive isEmailVerified isDeleted")
        .populate("assignedAgentId", "firstName lastName email role phone isActive isEmailVerified isDeleted")
        .populate("categoryId", "name description isActive isDeleted");

        if(getAllTickets.length === 0) return res.status(200).json({status: false, data: getAllTickets, msg: "No tickets found"});
        return res.status(200).json({status: true, data: getAllTickets, msg: "Tickets found"});

    }catch(err){
        console.log(err);
    }
}

const getTicketDetails= async(req, res)=>{
    try{
        const ticketDetail= await Ticket.findById(req.params.id)
        .populate("customerId", "firstName lastName email role phone isActive isEmailVerified isDeleted")
        .populate("assignedAgentId", "firstName lastName email role phone isActive isEmailVerified isDeleted")
        .populate("categoryId", "name description isActive isDeleted");

        if(!ticketDetail) return res.status(200).json({status: false, data: ticketDetail, msg: "No ticket found"});
        return res.status(200).json({status: true, data: ticketDetail, msg: "Ticket found"});
    }catch(err){
        console.log(err);
    }
}

const updateTicket= async(req, res)=>{
    try{
        const {priority, status, assignedAgentId}= req.body;
        const ticket= await Ticket.findById(req.params.id);
        if(!ticket) return res.status(200).json({status: false, data: ticket, msg: "Ticket not found"});

        if(assignedAgentId !== undefined) ticket.assignedAgentId= assignedAgentId;
        if(status !== undefined) ticket.status= status;
        if(priority !== undefined) ticket.priority= priority;
        const updateTicket= await Ticket.findByIdAndUpdate(req.params.id,
            {$set: ticket}, {new: true}
        )
        if(updateTicket) return res.status(200).json({status: true, data: updateTicket, msg: "Ticket updated successfully"});
    }catch(err){
        console.log(err);
    }
}

export default{
    getAllTicket,
    getTicketDetails,
    updateTicket
}