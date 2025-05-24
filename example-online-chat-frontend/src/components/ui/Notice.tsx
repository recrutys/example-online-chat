"use client";

import {useEffect, useState} from "react";

let globalNotices: Notice[] = [];
let updater: (notices: Notice[]) => void = () =>
{
};

const MAX_NOTICES: number = 5;
const VISIBLE_DURATION: number = 5000;
const ANIMATION_DURATION: number = 500; // Длительность анимации в ms

type Notice = {
    id: number;
    message: string;
    type: string;
    show: boolean;
};

type NoticeType = 'error' | 'success';

export function useNotices()
{
    const [notices, setNotices] = useState<Notice[]>(globalNotices);

    useEffect(() =>
    {
        updater = (newNotices) =>
        {
            globalNotices = newNotices;
            setNotices(newNotices);
        };
        return () =>
        {
            updater = () =>
            {
            }
        };
    }, []);

    function addNotice(message: string, type: NoticeType)
    {
        const newNoticeData: Notice = {
            id: Date.now(),
            message,
            type,
            show: false,
        };

        const updatedNotices = [...globalNotices, newNoticeData].slice(-MAX_NOTICES);
        globalNotices = updatedNotices;
        updater(updatedNotices);

        // Анимация появления
        setTimeout(() =>
        {
            const updated = globalNotices.map(n =>
                n.id === newNoticeData.id ? {...n, show: true} : n
            );
            globalNotices = updated;
            updater(updated);
        }, 10);

        // Автоудаление через 5 секунд
        setTimeout(() =>
        {
            const updated = globalNotices.map(n =>
                n.id === newNoticeData.id ? {...n, show: false} : n
            );
            globalNotices = updated;
            updater(updated);

            setTimeout(() =>
            {
                const filtered = globalNotices.filter(n => n.id !== newNoticeData.id);
                globalNotices = filtered;
                updater(filtered);
            }, ANIMATION_DURATION);
        }, VISIBLE_DURATION);
    }

    return {notices, addNotice};
}

export function Notices()
{
    const {notices} = useNotices();

    return (
        <div className="js-noticesList">
            {notices.map(notice => (
                <div key={notice.id}
                     className={`js-noticeItem js-noticeItem--${notice.type} ${notice.show ? 'show' : 'hide'}`}>
                    {notice.message}
                </div>
            ))}
        </div>
    );
}