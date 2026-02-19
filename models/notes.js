const db = require('../db');

function addNote(userId, title, content, callback) {
    db.query('INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)', [userId, title, content], callback);
}

function deleteNote(noteId, callback) {
    db.query('DELETE FROM notes WHERE id = ?', [noteId], callback);
}

function editNote(id, title, content, callback) {
    const sql = 'UPDATE notes SET title = ?, content = ? WHERE id = ?';
    const values = [title, content, id];

    db.query(sql, values, (err, result) => {
        if (err) {
            return callback(err);
        }
        callback(null, result);
    });
}

module.exports = {
    addNote,
    deleteNote,
    editNote
};
