const { db } = require('../services/dbEngine');

exports.getVendors = async (req, res) => {
  try {
    const eventId = req.params.eventId || req.query.eventId;
    let query = {};
    if (eventId) {
      query.eventId = eventId;
    }

    const vendors = await db.collection('vendors').find(query);

    // Summary statistics
    const stats = {
      total: vendors.length,
      booked: vendors.filter(v => v.status === 'booked' || v.status === 'completed').length,
      pending: vendors.filter(v => v.status === 'researching' || v.status === 'contacted' || v.status === 'quoted').length,
      totalAgreedAmount: vendors.reduce((acc, v) => acc + (v.agreedAmount || 0), 0),
      totalDepositsPaid: vendors.reduce((acc, v) => acc + (v.depositPaid || 0), 0),
      remainingBalance: vendors.reduce((acc, v) => acc + Math.max(0, (v.agreedAmount || 0) - (v.depositPaid || 0)), 0)
    };

    res.status(200).json({
      success: true,
      stats,
      vendors
    });
  } catch (err) {
    console.error('Get vendors error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching vendors.'
    });
  }
};

exports.createVendor = async (req, res) => {
  try {
    const {
      eventId,
      name,
      category,
      contactPerson,
      email,
      phone,
      website,
      status,
      quotedAmount,
      agreedAmount,
      depositPaid,
      paymentStatus,
      contractNotes,
      checklistItems
    } = req.body;

    if (!eventId || !name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide eventId, vendor name, and category.'
      });
    }

    const defaultChecklistsByCategory = {
      Venue: [
        { title: 'Confirm date availability & booking window', isCompleted: false },
        { title: 'Check noise curfew and cleanup policies', isCompleted: false },
        { title: 'Verify outside vendor policy & insurance certificates', isCompleted: false }
      ],
      Catering: [
        { title: 'Schedule tasting session', isCompleted: false },
        { title: 'Confirm dietary options (Vegan, GF, Halal)', isCompleted: false },
        { title: 'Review staff-to-guest ratio & bar package', isCompleted: false }
      ],
      Photography: [
        { title: 'Review full wedding/event gallery', isCompleted: false },
        { title: 'Confirm turnaround time & RAW file policy', isCompleted: false },
        { title: 'Submit must-have shot list', isCompleted: false }
      ],
      Decoration: [
        { title: 'Review mockup color palette and textures', isCompleted: false },
        { title: 'Confirm teardown and cleanup responsibility', isCompleted: false }
      ],
      Entertainment: [
        { title: 'Verify sound and lighting equipment requirements', isCompleted: false },
        { title: 'Submit master song list & do-not-play list', isCompleted: false }
      ],
      Transportation: [
        { title: 'Confirm pickup and drop-off schedule', isCompleted: false },
        { title: 'Verify vehicle air conditioning and insurance', isCompleted: false }
      ],
      Invitations: [
        { title: 'Approve digital print proof and paper weight', isCompleted: false },
        { title: 'Confirm delivery deadline before mailing date', isCompleted: false }
      ],
      'Lighting & Sound': [
        { title: 'Check venue power outlets & amperage capacity', isCompleted: false },
        { title: 'Confirm wireless lapel microphone setup', isCompleted: false }
      ]
    };

    const finalChecklist = checklistItems && checklistItems.length > 0
      ? checklistItems
      : (defaultChecklistsByCategory[category] || [
          { title: 'Review written contract terms', isCompleted: false },
          { title: 'Confirm payment schedule', isCompleted: false }
        ]);

    const newVendor = await db.collection('vendors').create({
      eventId,
      name: name.trim(),
      category,
      contactPerson: contactPerson || '',
      email: email || '',
      phone: phone || '',
      website: website || '',
      status: status || 'researching',
      quotedAmount: Number(quotedAmount) || 0,
      agreedAmount: Number(agreedAmount) || 0,
      depositPaid: Number(depositPaid) || 0,
      paymentStatus: paymentStatus || 'pending',
      contractNotes: contractNotes || '',
      checklistItems: finalChecklist
    });

    res.status(201).json({
      success: true,
      message: 'Vendor created successfully.',
      vendor: newVendor
    });
  } catch (err) {
    console.error('Create vendor error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating vendor.'
    });
  }
};

exports.updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.collection('vendors').findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found.'
      });
    }

    const updated = await db.collection('vendors').findByIdAndUpdate(id, { $set: req.body });

    res.status(200).json({
      success: true,
      message: 'Vendor updated successfully.',
      vendor: updated
    });
  } catch (err) {
    console.error('Update vendor error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating vendor.'
    });
  }
};

exports.deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const removed = await db.collection('vendors').findByIdAndDelete(id);

    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vendor removed.'
    });
  } catch (err) {
    console.error('Delete vendor error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting vendor.'
    });
  }
};

