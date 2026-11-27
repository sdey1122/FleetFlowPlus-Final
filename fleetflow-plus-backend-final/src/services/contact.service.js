const Contact = require("../model/contact.model");
const { safe, admins } = require("./notification.service");
const submit = async (data) => {
  const contact = await Contact.create(data);
  await safe(() =>
    admins(
      `contact:${contact.id}`,
      "New contact enquiry",
      `${contact.name} sent a contact enquiry.`,
      "contact",
    ),
  );
};
module.exports = { submit };
