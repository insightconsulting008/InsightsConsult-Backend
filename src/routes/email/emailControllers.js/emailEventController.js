const prisma = require("../../prisma/prisma.js");



const getEvent = async (req,res) => {
    const getAllEvent = await prisma.emailEvent.findMany()
    res.json({
        success: true,
        data: getAllEvent
      });
}

const toggleEvent = async (req, res) => {

  const { name, enabled } = req.body;

  const event = await prisma.emailEvent.update({
    where: { name },
    data: { enabled }
  });

  res.json({
    success: true,
    data: event
  });

};

module.exports = {
  toggleEvent,
  getEvent
};