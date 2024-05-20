import React, { useEffect, useRef, useState } from 'react'
import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles()(theme => {
    return {
        chatDropWrapper: {
            display: 'flex',
            position: 'absolute',
            flexDirection: 'column',
            top: 110,
            bottom: 0,
            flex: 1
        }
    };
});

function DragAndDrop({ children, disabled, dropString, handleDrop: onDrop }) {
    const [drag, setDrag] = useState(false);
    const [dragCounter, setDragCounter] = useState(0);
    const { classes } = useStyles();

    const dropRef = useRef();

    useEffect(() => {
        if (disabled || !dropRef.current) return;

        if (!disabled) {
            dropRef.current?.addEventListener('dragenter', handleDragIn);
            dropRef.current?.addEventListener('dragleave', handleDragOut);
            dropRef.current?.addEventListener('dragover', handleDrag);
            dropRef.current?.addEventListener('drop', handleDrop);
        }
        return () => {
            if (!disabled) {
                dropRef.current?.removeEventListener('dragenter', handleDragIn);
                dropRef.current?.removeEventListener('dragleave', handleDragOut);
                dropRef.current?.removeEventListener('dragover', handleDrag);
                dropRef.current?.removeEventListener('drop', handleDrop);
            }
        };
    }, [disabled, dropRef]);

  
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
    }

    const handleDragIn = (e) => {
        e.preventDefault();
        e.stopPropagation();

        setDragCounter(dragCounter + 1);
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setDrag(true);
        }
    }

    const handleDragOut = (e) => {
        e.preventDefault();
        e.stopPropagation();

        setDragCounter(dragCounter - 1);
        if (dragCounter === 0) {
            setDrag(false);
        }
    }

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();

        setDrag(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            //Only support for single file upload at this
            onDrop(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
            setDragCounter(0);
        }
    }

    return (
        <div className = { classes.chatDropWrapper } ref = {dropRef}>
            {drag &&
                <div
                    style={{
                        border: 'dashed grey 4px',
                        backgroundColor: 'rgba(255,255,255,.8)',
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 9999
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            right: 0,
                            left: 0,
                            textAlign: 'center',
                            color: 'grey',
                            fontSize: 36
                        }}
                    >
                        <div>{dropString}</div>
                    </div>
                </div>
            }
            {children}
        </div>
    )
}

export default DragAndDrop;